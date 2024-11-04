<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\Request;

class PatientListController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $search = $request->get("search");
        $patients = auth()->user()->Patients()->where(function ($q) use ($search) {
            $q->where("fullName", "like", "%$search%");
            $q->orWhere("id_no", "like", "%$search%");
        })->orWhere("reference_id", "like", "%$search%")->paginate(10);
        return PatientResource::collection($patients);
    }
}
