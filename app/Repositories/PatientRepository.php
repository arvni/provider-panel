<?php

namespace App\Repositories;

use App\Interfaces\PatientRepositoryInterface;
use App\Models\Patient;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PatientRepository extends BaseRepository implements PatientRepositoryInterface
{
    public function __construct(Patient $patient)
    {
        $this->query = $patient->newQuery();
    }

    /**
     * Get paginated list of patients for current user
     */
    public function list(array $queryData = []): LengthAwarePaginator
    {
        $this->query
            ->where('user_id', auth()->user()->id)
            ->with('RelatedPatients')
            ->withCount(['Orders', 'OrderItems']);

        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }

        if (isset($queryData['sort'])) {
            $this->applyOrderBy($queryData['sort']);
        }

        return $this->applyPagination($queryData["pageSize"] ?? $this->pageSize);
    }

    /**
     * Get all patients for current user
     */
    public function getAll(array $queryData = []): Collection|array
    {
        $this->query->where('user_id', auth()->user()->id);

        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }

        if (isset($queryData['sort'])) {
            $this->applyOrderBy($queryData['sort']);
        }

        return $this->applyGet();
    }

    /**
     * Show a patient with all relations
     */
    public function show(Patient $patient): Patient
    {
        $patient->load(['RelatedPatients', 'Orders', 'OrderItems']);
        return $patient;
    }

    /**
     * Update a patient
     */
    public function update(Patient $patient, array $data): Patient
    {
        $patient->fill([
            'fullName' => $data['fullName'],
            'nationality' => $data['nationality']['code'] ?? $data['nationality'],
            'dateOfBirth' => $data['dateOfBirth'],
            'gender' => $data['gender'],
            'consanguineousParents' => $data['consanguineousParents'],
            'contact' => $data['contact'] ?? null,
            'extra' => $data['extra'] ?? null,
            'isFetus' => $data['isFetus'] ?? false,
            'reference_id' => !empty($data['reference_id']) ? $data['reference_id'] : null,
            'id_no' => !empty($data['id_no']) ? $data['id_no'] : null,
        ]);

        if ($patient->isDirty()) {
            $patient->save();
        }

        // Handle relations if provided
        if (isset($data['relations']) && is_array($data['relations'])) {
            $relationsToSync = [];
            foreach ($data['relations'] as $relation) {
                if (isset($relation['related_patient_id'])) {
                    $relationsToSync[$relation['related_patient_id']] = [
                        'relation_type' => $relation['relation_type'] ?? null,
                        'notes' => $relation['notes'] ?? null
                    ];
                }
            }
            if (!empty($relationsToSync)) {
                $patient->RelatedPatients()->sync($relationsToSync);
            } else {
                $patient->RelatedPatients()->detach();
            }
        }

        return $patient->fresh();
    }

    /**
     * Delete a patient if not related to any orders
     */
    public function delete(Patient $patient): bool
    {
        // Check if patient has any orders as main patient
        if ($patient->Orders()->count() > 0) {
            throw new \Exception("Cannot delete patient. Patient is assigned as main patient in {$patient->Orders()->count()} order(s).");
        }

        // Check if patient is involved in any order items
        if ($patient->OrderItems()->count() > 0) {
            throw new \Exception("Cannot delete patient. Patient is assigned to {$patient->OrderItems()->count()} test(s) in orders.");
        }

        // Delete relations first
        $patient->RelatedPatients()->detach();

        return $patient->delete();
    }

    /**
     * Check if patient can be deleted
     */
    public function canDelete(Patient $patient): array
    {
        $ordersCount = $patient->Orders()->count();
        $orderItemsCount = $patient->OrderItems()->count();

        return [
            'can_delete' => $ordersCount === 0 && $orderItemsCount === 0,
            'orders_count' => $ordersCount,
            'order_items_count' => $orderItemsCount,
            'reason' => $ordersCount > 0
                ? "Patient is main patient in {$ordersCount} order(s)"
                : ($orderItemsCount > 0
                    ? "Patient is assigned to {$orderItemsCount} test(s)"
                    : null)
        ];
    }

    /**
     * Apply filters
     */
    public function applyFilter($filters = []): void
    {
        if (isset($filters['search'])) {
            $this->query->where(function ($q) use ($filters) {
                $q->where('fullName', 'like', "%{$filters['search']}%")
                  ->orWhere('reference_id', 'like', "%{$filters['search']}%")
                  ->orWhere('id_no', 'like', "%{$filters['search']}%");
            });
        }

        if (isset($filters['gender'])) {
            $this->query->where('gender', $filters['gender']);
        }

        if (isset($filters['nationality'])) {
            $this->query->where('nationality', $filters['nationality']);
        }
    }
}
