<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadFileService
{

    /**
     * @param string $key
     * @param string $path
     * @return array
     */
    public function init(string $path = "tmp", string $key = "file"): array
    {
        $files = request()->file($key);
        $output = [];
        if ($files) {
            if (!Str::endsWith($path, "/"))
                $path .= "/";
            if (is_array($files)) {
                foreach ($files as $file) {
                    $fileName = $this->getFileName($file);
                    if ($this->upload($file, $fileName, $path)) {
                        $output[] = "$path$fileName";
                    }
                }
            } else {
                $fileName = $this->getFileName($files);
                if ($this->upload($files, $fileName, $path)) {
                    $output[] = "$path$fileName";
                }
            }
        }
        return $output;
    }


    /**
     * @param UploadedFile $file
     * @param string $filename
     * @param string $path
     * @return bool
     */
    public function upload(UploadedFile $file, string $filename, string $path = "/"): bool
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
     * @param UploadedFile $file
     * @return string
     */
    private function getFileName(UploadedFile $file): string
    {
        return Str::uuid() . "." . $file->getClientOriginalExtension();
    }

}
