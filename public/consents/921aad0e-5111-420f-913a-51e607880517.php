<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadAvatarController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $request->validate([
            'file' => ['required']
        ]);
        $file = $request->file('file');
        $fileName=Str::uuid().".".$file->getClientOriginalExtension();
        try {
            Storage::disk('public_images')->putFileAs("/", $file, $fileName);
            return response()->json(["src"=>"/images/$fileName"]);
        } catch (\Exception $exception) {
            return abort('500', $exception->getMessage());
        }
    }
}
