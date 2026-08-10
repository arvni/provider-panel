<?php

namespace Tests\Unit;

use App\Rules\SafeUpload;
use App\Services\UploadFileService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class SafeUploadTest extends TestCase
{
    /** @var array<int, string> Temp files to clear; the 50 MB ones add up fast. */
    private array $temporaryFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->temporaryFiles as $path) {
            // Stored uploads have already been moved off this path.
            if (is_file($path)) {
                unlink($path);
            }
        }
        $this->temporaryFiles = [];

        parent::tearDown();
    }

    private function temporaryPath(string $prefix): string
    {
        return $this->temporaryFiles[] = tempnam(sys_get_temp_dir(), $prefix);
    }

    /**
     * Build an upload with real content, so the rules see what a browser would
     * actually send rather than a placeholder Laravel invented.
     */
    private function upload(string $name, string $contents): UploadedFile
    {
        $path = $this->temporaryPath('upl');
        file_put_contents($path, $contents);

        return new UploadedFile($path, $name, null, null, true);
    }

    private function pngContents(): string
    {
        $image = imagecreatetruecolor(10, 10);
        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }

    private function pdfContents(): string
    {
        return "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
    }

    private function docxContents(): string
    {
        return $this->ooxmlContents('word/document.xml', 'wordprocessingml.document');
    }

    private function xlsxContents(): string
    {
        return $this->ooxmlContents('xl/workbook.xml', 'spreadsheetml.sheet');
    }

    private function ooxmlContents(string $part, string $type): string
    {
        $path = $this->temporaryPath('ooxml');
        $zip = new \ZipArchive;
        $zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            ."<Override PartName=\"/$part\" ContentType=\"application/vnd.openxmlformats-officedocument.$type.main+xml\"/></Types>");
        $zip->addFromString($part, '<root/>');
        $zip->close();

        return (string) file_get_contents($path);
    }

    private function plainZipContents(): string
    {
        $path = $this->temporaryPath('zip');
        $zip = new \ZipArchive;
        $zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        $zip->addFromString('readme.txt', 'not an office document');
        $zip->close();

        return (string) file_get_contents($path);
    }

    private function passes(UploadedFile $file): bool
    {
        return Validator::make(['file' => $file], ['file' => SafeUpload::rules()])->passes();
    }

    /**
     * Which content types libmagic reports varies by build, so a failure here
     * has to name what it actually saw or it is undebuggable on a machine that
     * is not this one.
     */
    private function assertAccepted(UploadedFile $file): void
    {
        $this->assertTrue(
            $this->passes($file),
            "{$file->getClientOriginalName()} was rejected; it sniffed as {$file->getMimeType()}."
        );
    }

    public function test_it_accepts_images_and_documents(): void
    {
        $this->assertAccepted($this->upload('scan.png', $this->pngContents()));
        $this->assertAccepted($this->upload('report.pdf', $this->pdfContents()));
        $this->assertAccepted($this->upload('form.docx', $this->docxContents()));
        $this->assertAccepted($this->upload('sheet.xlsx', $this->xlsxContents()));
    }

    public function test_it_rejects_one_office_type_wearing_anothers_name(): void
    {
        $this->assertFalse($this->passes($this->upload('sheet.xlsx', $this->docxContents())));
    }

    /**
     * An OOXML file is a zip underneath, and some libmagic builds report only
     * that. The name still has to claim an office extension.
     */
    public function test_it_accepts_an_office_document_that_only_sniffs_as_its_container(): void
    {
        $zip = $this->upload('report.docx', $this->plainZipContents());

        $this->assertContains($zip->getMimeType(), ['application/zip', 'application/x-zip-compressed']);
        $this->assertAccepted($zip);
        $this->assertFalse($this->passes($this->upload('report.zip', $this->plainZipContents())));
    }

    /**
     * A valid PDF padded out to roughly the given size. Written in chunks
     * rather than built as one string, which a 50 MB body would not fit in the
     * CLI memory limit.
     */
    private function paddedPdf(string $name, int $kilobytes): UploadedFile
    {
        $path = $this->temporaryPath('pdf');
        $handle = fopen($path, 'wb');
        fwrite($handle, $this->pdfContents());
        // Padding goes after %%EOF, where a PDF reader ignores it.
        for ($written = 0; $written < $kilobytes; $written++) {
            fwrite($handle, str_repeat('%', 1024));
        }
        fclose($handle);

        return new UploadedFile($path, $name, null, null, true);
    }

    public function test_it_accepts_a_file_up_to_fifty_megabytes(): void
    {
        $this->assertSame(51200, SafeUpload::MAX_KILOBYTES);
        $this->assertTrue($this->passes($this->paddedPdf('big.pdf', 51100)));
        $this->assertFalse($this->passes($this->paddedPdf('too-big.pdf', 51300)));
    }

    public function test_document_only_fields_do_not_take_images(): void
    {
        $rules = ['file' => SafeUpload::documentRules()];

        $this->assertTrue(Validator::make(['file' => $this->upload('form.pdf', $this->pdfContents())], $rules)->passes());
        $this->assertFalse(Validator::make(['file' => $this->upload('scan.png', $this->pngContents())], $rules)->passes());
    }

    public function test_it_rejects_svg_and_other_active_content(): void
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';

        $this->assertFalse($this->passes($this->upload('logo.svg', $svg)));
        $this->assertFalse($this->passes($this->upload('page.html', '<html><body>x</body></html>')));
        $this->assertFalse($this->passes($this->upload('shell.php', '<?php echo 1;')));
        $this->assertFalse($this->passes($this->upload('notes.txt', 'plain text')));
    }

    public function test_it_rejects_a_disguised_file_whose_content_disagrees_with_its_name(): void
    {
        // Script content wearing an allowed extension.
        $this->assertFalse($this->passes($this->upload('avatar.png', '<?php echo 1;')));
        $this->assertFalse($this->passes($this->upload('report.pdf', '<svg xmlns="http://www.w3.org/2000/svg"/>')));

        // Allowed content wearing a disallowed extension.
        $this->assertFalse($this->passes($this->upload('payload.phtml', $this->pngContents())));
    }

    public function test_the_service_stores_allowed_files_under_the_detected_extension(): void
    {
        Storage::fake('local');

        $this->app['request']->files->set('file', $this->upload('scan.PNG', $this->pngContents()));

        $stored = app(UploadFileService::class)->init('consents');

        $this->assertCount(1, $stored);
        $this->assertMatchesRegularExpression('#^consents/[0-9a-f-]{36}\.png$#', $stored[0]);
        Storage::disk('local')->assertExists($stored[0]);
    }

    public function test_the_service_refuses_to_store_a_disallowed_file(): void
    {
        Storage::fake('local');

        $this->app['request']->files->set('file', $this->upload('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>'));

        $this->assertSame([], app(UploadFileService::class)->init('consents'));
        $this->assertEmpty(Storage::disk('local')->allFiles('consents'));
    }
}
