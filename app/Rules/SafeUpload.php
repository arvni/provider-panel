<?php

namespace App\Rules;

use Illuminate\Validation\Rules\File;

/**
 * Central allow-list for every file a user (or the lab webhook) may upload.
 *
 * Only raster images and the office/PDF documents the lab actually works with
 * are accepted. Two deliberate omissions:
 *
 *  - SVG is an XML document that can carry <script>/onload handlers, so it is
 *    treated as active content, not as an image.
 *  - HTML, PHP and every other executable/markup type is rejected by not being
 *    on the list (Laravel additionally hard-blocks php* uploads).
 *
 * Rules produced here check the extension of the uploaded name *and* the type
 * sniffed from the file content, so renaming shell.php to shell.png does not
 * get past them.
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
     * Everything that is allowed to reach the disk.
     *
     * @return array<int, string>
     */
    public static function extensions(): array
    {
        return [...self::IMAGE_EXTENSIONS, ...self::DOCUMENT_EXTENSIONS];
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
     * Is this extension one we accept? Used as the last gate before writing.
     */
    public static function allows(string $extension): bool
    {
        return in_array(strtolower($extension), self::extensions(), true);
    }

    /**
     * @param  array<int, string>  $extensions
     * @return array<int, mixed>
     */
    private static function rulesFor(array $extensions, int $maxKilobytes): array
    {
        return [
            'file',
            // extensions:  the name the browser sent must end in an allowed type.
            // File::types(): the content must actually sniff as that type.
            'extensions:'.implode(',', $extensions),
            File::types($extensions)->max($maxKilobytes),
        ];
    }
}
