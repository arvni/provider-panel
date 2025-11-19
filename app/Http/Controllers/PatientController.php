<?php

namespace App\Http\Controllers;

use App\Interfaces\PatientRepositoryInterface;
use App\Models\Patient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    protected PatientRepositoryInterface $patientRepository;

    public function __construct(PatientRepositoryInterface $patientRepository)
    {
        $this->patientRepository = $patientRepository;
    }

    /**
     * Display a listing of patients
     */
    public function index(Request $request): Response
    {
        $requestInputs = $request->all();
        $patients = fn() => $this->patientRepository->list($requestInputs);

        return Inertia::render('Patient/Index', [
            'patients' => $patients,
            'request' => $requestInputs
        ]);
    }

    /**
     * Show the form for editing the specified patient
     */
    public function edit(Patient $patient): Response
    {
        $this->authorize('update', $patient);

        $patient = $this->patientRepository->show($patient);

        // Format relations for frontend
        if ($patient->RelatedPatients && $patient->RelatedPatients->count() > 0) {
            $patient->relations = $patient->RelatedPatients->map(function ($relatedPatient) {
                return [
                    'related_patient_id' => $relatedPatient->id,
                    'relation_type' => $relatedPatient->pivot->relation_type,
                    'notes' => $relatedPatient->pivot->notes
                ];
            })->toArray();
        } else {
            $patient->relations = [];
        }

        // Check if patient can be deleted
        $deleteInfo = $this->patientRepository->canDelete($patient);

        // Get all available genders
        $genders = ['1', '0', '-1']; // MALE, FEMALE, UNKNOWN

        return Inertia::render('Patient/Edit', [
            'patient' => $patient,
            'canDelete' => $deleteInfo['can_delete'],
            'deleteReason' => $deleteInfo['reason'],
            'genders' => $genders
        ]);
    }

    /**
     * Update the specified patient
     */
    public function update(Request $request, Patient $patient): RedirectResponse
    {
        $this->authorize('update', $patient);

        $validated = $request->validate([
            'fullName' => 'required|string|max:255',
            'nationality' => 'required',
            'dateOfBirth' => 'required|date',
            'gender' => 'required|in:-1,0,1',
            'consanguineousParents' => 'required|in:-1,0,1',
            'contact' => 'nullable|array',
            'extra' => 'nullable|array',
            'isFetus' => 'boolean',
            'reference_id' => 'nullable|string|max:255',
            'id_no' => 'nullable|string|max:255',
            'relations' => 'nullable|array'
        ]);

        try {
            $this->patientRepository->update($patient, $validated);

            return back()->with([
                'status' => 'Patient updated successfully.'
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified patient
     */
    public function destroy(Patient $patient): RedirectResponse
    {
        $this->authorize('delete', $patient);

        try {
            $this->patientRepository->delete($patient);

            return redirect()->route('patients.index')->with([
                'status' => 'Patient deleted successfully.'
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }
    }
}
