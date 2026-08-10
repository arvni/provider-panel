<?php

namespace App\Rules;

use Illuminate\Http\UploadedFile;

/**
 * Central allow-list for every file a user (or the lab webhook) may upload.
 *
 * Only raster images and the office/PDF documents the lab actually works with
 * are accepted. Two deliberate omissions:
 *
 *  - SVG is an XML document that can carry <script>/onload handlers, so it is
 *    treated as active content, not as an image.
 *  - HTML, PHP and every other executable/markup type is rejected by not being
 *    on the list.
 *
 * A file is accepted only when the extension in its name is on the list *and*
 * the type sniffed from its content is one this extension may legitimately
 * have, so renaming shell.php to avatar.png does not get past it.
 */
final class SafeUpload
{
    /**
     * Images we are able to render and that carry no scripting capability.
     */
    public const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    /**
     * Documents the lab exchanges with providers.
     *
     * CSV is left out on purpose: it sniffs as plain text (so content and name
     * cannot be cross-checked) and spreadsheet apps execute leading "=" cells.
     */
    public const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

    /**
     * Default ceiling for a single uploaded file, in kilobytes (50 MB).
     *
     * PHP has to allow at least this much as well: see upload_max_filesize and
     * post_max_size in the Dockerfiles. A body over post_max_size arrives empty,
     * so the limits there must stay at or above this one.
     */
    public const MAX_KILOBYTES = 51200;

    /**
     * The content types each extension is allowed to sniff as, lower-cased.
     *
     * The office entries carry their container type as well, because how much
     * an OOXML file is recognised as more than a zip, or a legacy .doc as more
     * than an OLE2 compound file, depends on the libmagic build underneath —
     * strict OOXML-only matching rejects real Word documents on some hosts. The
     * name still has to be .docx/.xlsx, and everything here is served as an
     * attachment, so the worst a zip in that disguise achieves is being stored.
     *
     * The corollary is that on a build which reports only the container, a
     * .docx and a .xlsx cannot be told apart. That is a mislabelling, not a
     * security boundary: both are types this list already accepts.
     *
     * @var array<string, array<int, string>>
     */
    private const CONTENT_TYPES = [
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'gif' => ['image/gif'],
        'webp' => ['image/webp'],
        'pdf' => ['application/pdf'],
        'doc' => [
            'application/msword',
            'application/vnd.ms-office',
            'application/x-ole-storage',
            'application/cdfv2',
        ],
        'docx' => [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
        ],
        'xls' => [
            'application/vnd.ms-excel',
            'application/vnd.ms-office',
            'application/x-ole-storage',
            'application/cdfv2',
        ],
        'xlsx' => [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
        ],
    ];

    /**
     * Everything that is allowed to reach the disk.
     *
     * @return array<int, string>
     */
    public static function extensions(): array
    {
        return [...self::IMAGE_EXTENSIONS, ...self::DOCUMENT_EXTENSIONS];
    }

    /**
     * The extension an upload may be stored under, or null when it is not an
     * allowed type. Both the name and the content have to agree.
     *
     * @param  array<int, string>|null  $allowed
     */
    public static function resolveExtension(UploadedFile $file, ?array $allowed = null): ?string
    {
        $allowed ??= self::extensions();
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, $allowed, true)) {
            return null;
        }

        $contentType = strtolower((string) $file->getMimeType());

        return in_array($contentType, self::CONTENT_TYPES[$extension] ?? [], true)
            ? $extension
            : null;
    }

    /**
     * Rules for an attachment that may be an image or a document.
     *
     * @return array<int, mixed>
     */
    public static function rules(int $maxKilobytes = self::MAX_KILOBYTES): array
    {
        return self::rulesFor(self::extensions(), $maxKilobytes);
    }

    /**
     * Rules for an attachment that must be an image.
     *
     * @return array<int, mixed>
     */
    public static function imageRules(int $maxKilobytes = self::MAX_KILOBYTES): array
    {
        return self::rulesFor(self::IMAGE_EXTENSIONS, $maxKilobytes);
    }

    /**
     * Rules for an attachment that must be a document.
     *
     * @return array<int, mixed>
     */
    public static function documentRules(int $maxKilobytes = self::MAX_KILOBYTES): array
    {
        return self::rulesFor(self::DOCUMENT_EXTENSIONS, $maxKilobytes);
    }

    /**
     * @param  array<int, string>  $extensions
     * @return array<int, mixed>
     */
    private static function rulesFor(array $extensions, int $maxKilobytes): array
    {
        return ['file', 'max:'.$maxKilobytes, new AllowedFileType($extensions)];
    }
}
