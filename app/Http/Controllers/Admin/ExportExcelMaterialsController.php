<?php

namespace App\Http\Controllers\Admin;

use App\Exports\MaterialExport;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportExcelMaterialsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        return Excel::download(new MaterialExport, Carbon::now()->format("Y-m-d-h:i") . '.xlsx');
    }
}
