<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Interfaces\DoctorRepositoryInterface;
use App\Models\Doctor;
use App\Http\Requests\StoreDoctorRequest;
use App\Http\Requests\UpdateDoctorRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DoctorController extends Controller
{
    protected DoctorRepositoryInterface $doctorRepository;

    public function __construct(DoctorRepositoryInterface $doctorRepository)
    {
        $this->doctorRepository = $doctorRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $doctors = $this->doctorRepository->getAllDoctors($request->all());
        return Inertia::render("Doctor/Index", ["doctors" => $doctors, "request" => $request->all()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDoctorRequest $request)
    {
        $this->doctorRepository->createDoctor($request->all());
        return redirect()->route("admin.doctors.index")->with(["status" => __("messages.successfullyAdded", ["type" => "doctor", "title" => $request->get("title")])]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Doctor $doctor)
    {
        return new DoctorResource($doctor);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDoctorRequest $request, Doctor $doctor)
    {
        $this->doctorRepository->updateDoctor($doctor,$request->all());
        return redirect()->route("admin.doctors.index")->with(["status" => __("messages.successfullyUpdated", ["type" => "doctor", "title" => $request->get("title")])]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Doctor $doctor)
    {
        //
    }
}
