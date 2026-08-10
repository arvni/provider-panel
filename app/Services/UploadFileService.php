<?php

namespace App\Services;

use App\Rules\SafeUpload;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadFileService
{
    public function init(string $path = 'tmp', string $key = 'file'): array
    {
        $files = request()->file($key);
        $output = [];
        if ($files) {
            if (! Str::endsWith($path, '/')) {
                $path .= '/';
            }
            foreach (is_array($files) ? $files : [$files] as $file) {
                $fileName = $this->getFileName($file);
                if ($fileName && $this->upload($file, $fileName, $path)) {
                    $output[] = "$path$fileName";
                }
            }
        }

        return $output;
    }

    public function upload(UploadedFile $file, string $filename, string $path = '/'): bool
    {
        if ($file->isFile()) {
            try {
                Storage::disk('local')->putFileAs($path, $file, $filename);

                return true;
            } catch (Exception $e) {
                Log::alert($e->getMessage());
            }
        }

        return false;
    }

    /**
     * Build the name the file is stored under, or null when the file is not an
     * allowed type.
     *
     * The extension is only kept once the sniffed content agrees with it, so an
     * upload cannot choose to land on disk as something it is not. Requests are
     * validated against the same allow-list (@see SafeUpload); this is the last
     * gate for any path that is not, such as the lab webhooks.
     */
    private function getFileName(UploadedFile $file): ?string
    {
        $extension = SafeUpload::resolveExtension($file);

        if ($extension === null) {
            Log::warning('Rejected upload of disallowed type', [
                'client_name' => $file->getClientOriginalName(),
                'detected_mime' => $file->getMimeType(),
            ]);

            return null;
        }

        return Str::uuid().'.'.$extension;
    }
}
