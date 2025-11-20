<?php

namespace App\Repositories;

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Interfaces\MaterialRepositoryInterface;
use App\Interfaces\OrderFormRepositoryInterface;
use App\Interfaces\OrderMaterialRepositoryInterface;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\Material;
use App\Models\Order;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\SampleType;
use App\Services\UploadFileService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;

class OrderRepository extends BaseRepository implements OrderRepositoryInterface
{

    protected OrderFormRepositoryInterface $orderFormRepository;
    protected UploadFileService $uploadFileService;
    protected materialRepositoryInterface $materialRepository;

    public function __construct(Order                        $order,
                                OrderFormRepositoryInterface $orderFormRepository,
                                UploadFileService            $uploadFileService,
                                materialRepositoryInterface  $materialRepository)
    {
        $this->query = $order->newQuery();
        $this->orderFormRepository = $orderFormRepository;
        $this->uploadFileService = $uploadFileService;
        $this->materialRepository = $materialRepository;
    }

    /**
     * Retrieve all orders based on the provided query data.
     *
     * @param array $queryData
     * @return array|Collection
     */
    public function getAll(array $queryData = []): array|Collection
    {
        $this->query
            ->with("OrderItems.Samples")
            ->withAggregate("Patient", "fullName")
            ->withAggregate("Patient", "reference_id")
            ->withAggregate("Patient", "dateOfBirth");

        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }
        if (isset($queryData['orderBy'])) {
            $this->applyOrderBy($queryData['orderBy']);
        }

        return $this->applyGet();
    }

    /**
     * Retrieve all orders based on the provided query data.
     *
     * @param array $queryData
     * @return LengthAwarePaginator
     */
    public function list(array $queryData = []): LengthAwarePaginator
    {
        $this->query
            ->with("Tests:id,name")
            ->with("OrderItems.Samples")
            ->withAggregate("User", "name")
            ->withAggregate("Patient", "fullName")
            ->withAggregate("Patient", "reference_id")
            ->withAggregate("Patient", "dateOfBirth");

        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }
        if (isset($queryData['sort'])) {
            $this->applyOrderBy($queryData['sort']);
        }
        return $this->applyPagination($queryData["pageSize"] ?? $this->pageSize);
    }

    public function getRecentlyOrders()
    {
        return $this->query
            ->select(["id", "main_patient_id", "updated_at", "created_at", "status", "user_id"])
            ->where("user_id", auth()->user()->id)
            ->withAggregate("Tests", "name")
            ->withAggregate("Patient", "fullName")
            ->latest()
            ->limit(5)
            ->get();
    }

    public function notDownloadedOrdersReportCount()
    {
        return $this->query
            ->where("user_id", auth()->user()->id)
            ->where("status", OrderStatus::REPORTED)
            ->count();
    }

    /**
     * Apply filters to the query.
     *
     * @param array $filters
     * @return void
     */
    protected function applyFilter(array $filters): void
    {
        if (isset($filters["status"])) {
            $this->query->status($filters["status"]);
        }
        if (isset($filters['id'])) {
            $this->query->where('orders.id', 'like', '%' . $filters['id'] . '%');
        }
        if (isset($filters['user_id'])) {
            $this->query->whereHas("User", function ($q) use ($filters) {
                $q->where("id", $filters["user_id"]);
            });
        }
        if (isset($filters['user_name'])) {
            $this->query->search("User.name", $filters["user_name"]);
        }

        if (isset($filters['patient_full_name'])) {

            $this->query->search($filters["patient_full_name"], ["Patient.fullName"]);
        }

        if (isset($filters['patient_reference_id'])) {
            $this->query->search($filters['patient_reference_id'], ['Patient.reference_id']);
        }
    }


    /**
     * Get an order by its ID.
     *
     * @param $id
     * @return Order|null
     */
    public function getById($id): ?Order
    {
        return $this->query->find($id);
    }

    /**
     * Delete an order.
     *
     * @param Order $order
     * @return bool|null
     */
    public function delete(Order $order): ?bool
    {
        return $order->delete();
    }

    /**
     * Create a new order.
     *
     * @param array $orderDetails
     * @return Order
     */
    public function create(array $orderDetails): Order
    {
        $order = $this->query->make([
            "step" => OrderStep::PATIENT_DETAILS,
            "status" => OrderStatus::PENDING,
            "files" => [],
            "orderForms" => $this->getForms($orderDetails["tests"])
        ]);
        $order->User()->associate(auth()->user()->id);
        $order->save();
        $order->refresh();
        $this->testMethodUpdate($order, $orderDetails["tests"]);
        return $order;
    }

    /**
     * Update an order with new details.
     *
     * @param Order $order
     * @param array $newDetails
     * @param OrderStep $step
     * @return bool
     */
    public function update(Order $order, array $newDetails, OrderStep $step)
    {
        $order->fill([
            ...$newDetails,
        ]);

        switch ($step) {
            case OrderStep::PATIENT_DETAILS:
                $patientIds = [];
                $mainPatientId = null;

                // Handle multiple patients
                $patients = $newDetails["patients"] ?? [$newDetails]; // Support both array and single patient
                $savedPatients = []; // Store saved patients with their index

                // First pass: Create/update all patients
                foreach ($patients as $index => $patientData) {
                    if (isset($patientData["id"])) {
                        $patient = Patient::find($patientData["id"]);
                        $patient->fill([
                            "fullName" => $patientData["fullName"],
                            "nationality" => $patientData["nationality"]["code"],
                            "dateOfBirth" => $patientData["dateOfBirth"],
                            "gender" => $patientData["gender"],
                            "consanguineousParents" => $patientData["consanguineousParents"],
                            "contact" => $patientData["contact"] ?? null,
                            "extra" => $patientData["extra"] ?? null,
                            "isFetus" => $patientData["isFetus"] ?? false,
                            "reference_id" => !empty($patientData["reference_id"]) ? $patientData["reference_id"] : null,
                            "id_no" => !empty($patientData["id_no"]) ? $patientData["id_no"] : null
                        ]);
                        if ($patient->isDirty())
                            $patient->save();
                        $patientIds[] = $patient->id;
                        if ($index === 0) $mainPatientId = $patient->id;
                    } else {
                        $patient = new Patient([
                            "fullName" => $patientData["fullName"],
                            "nationality" => $patientData["nationality"]["code"],
                            "dateOfBirth" => $patientData["dateOfBirth"],
                            "gender" => $patientData["gender"],
                            "consanguineousParents" => $patientData["consanguineousParents"],
                            "contact" => $patientData["contact"] ?? null,
                            "extra" => $patientData["extra"] ?? null,
                            "isFetus" => $patientData["isFetus"] ?? false,
                            "reference_id" => !empty($patientData["reference_id"]) ? $patientData["reference_id"] : null,
                            "id_no" => !empty($patientData["id_no"]) ? $patientData["id_no"] : null
                        ]);
                        auth()->user()->Patients()->save($patient);
                        $patientIds[] = $patient->id;
                        if ($index === 0) $mainPatientId = $patient->id;
                    }

                    $savedPatients[$index] = ['patient' => $patient, 'data' => $patientData];
                }

                // Second pass: Handle patient relations after all patients are saved
                foreach ($savedPatients as $index => $item) {
                    $patient = $item['patient'];
                    $patientData = $item['data'];

                    if (isset($patientData["relations"]) && !empty($patientData["relations"])) {
                        foreach ($patientData["relations"] as $relation) {
                            $relatedPatientId = $relation["related_patient_id"];

                            // If related_patient_id is 'main', replace with main patient ID
                            if ($relatedPatientId === 'main') {
                                $relatedPatientId = $mainPatientId;
                            }

                            if ($relatedPatientId) {
                                $patient->RelatedPatients()->syncWithoutDetaching([
                                    $relatedPatientId => [
                                        "relation_type" => $relation["relation_type"] ?? null,
                                        "notes" => $relation["notes"] ?? null
                                    ]
                                ]);
                            }
                        }
                    }
                }

                // Set main patient and patient_ids
                $order->MainPatient()->associate($mainPatientId);
                $order->patient_ids = $patientIds;
                break;

            case OrderStep::PATIENT_TEST_ASSIGNMENT:
                // Handle patient-test assignments
                if (isset($newDetails["assignments"]) && !empty($newDetails["assignments"])) {
                    foreach ($newDetails["assignments"] as $assignment) {
                        $orderItem = $order->OrderItems()->where('test_id', $assignment['test_id'])->first();
                        if ($orderItem) {
                            // Clear existing assignments
                            $orderItem->Patients()->detach();

                            // Assign patients to this test
                            foreach ($assignment['patient_ids'] as $idx => $patientId) {
                                $orderItem->Patients()->attach($patientId, [
                                    'is_main' => $idx === 0 // First patient is main
                                ]);
                            }
                        }
                    }
                } else {
                    // Default: assign all tests to main patient
                    foreach ($order->OrderItems as $orderItem) {
                        $orderItem->Patients()->syncWithoutDetaching([
                            $order->main_patient_id => ['is_main' => true]
                        ]);
                    }
                }
                break;
            case OrderStep::SAMPLE_DETAILS:
                $samplesIds = [];
                foreach ($newDetails["samples"] as $sampleDetails) {
                    $sampleType = SampleType::find($sampleDetails["sample_type"]["id"]);
                    if (isset($sampleDetails["id"])) {
                        $sample = Sample::find($sampleDetails["id"]);
                        $sample->fill($sampleDetails);
                        $sample->SampleType()->associate($sampleType->id);

                        // Associate patient and order item if provided
                        if (isset($sampleDetails["patient_id"])) {
                            $sample->Patient()->associate($sampleDetails["patient_id"]);
                        }

                        if ($sampleType->sample_id_required) {
                            $material = Material::where("barcode", $sampleDetails["sampleId"])->first();
                            if ($material) {
                                $sample->Material()->associate($material->id);
                            } else {
                                throw new \Exception("Material with barcode '{$sampleDetails["sampleId"]}' not found.");
                            }
                        } else {
                            $sample->Material()->dissociate();
                        }
                        if ($sample->isDirty())
                            $sample->save();
                        $samplesIds[] = $sample->id;
                    } else {
                        $sample = $this->createSample($sampleDetails, $sampleType);
                        $samplesIds[] = $sample->id;
                    }
                    // Attach sample to order item using pivot table
                    if (isset($sampleDetails["order_item_id"])) {
                        $sample->OrderItems()->syncWithoutDetaching([$sampleDetails["order_item_id"]]);
                    }
                }
                // Delete samples not in the current list - query through order items
                $orderItemIds = $order->OrderItems()->pluck('id')->toArray();
                Sample::whereHas('OrderItems', function ($q) use ($orderItemIds) {
                    $q->whereIn('order_items.id', $orderItemIds);
                })->whereNotIn("id", $samplesIds)->delete();
                break;
            case OrderStep::FINALIZE:
                $order->status = OrderStatus::REQUESTED;
                break;
            case OrderStep::TEST_METHOD:
                $order->fill([
                    "orderForms" => $this->getForms($newDetails["tests"], $order)
                ]);
                $order->Tests()->sync(array_map(fn($test) => $test["id"], $newDetails["tests"]));
                break;
            case OrderStep::CLINICAL_DETAILS:
                $uploadedFiles = array_filter($newDetails["files"], fn($file) => is_string($file));
                $files = array_merge($uploadedFiles, $this->uploadFileService->init("Order/$order->id/", "files"));
                $order->fill([
                    "files" => $files,
                ]);
                break;
            case OrderStep::CONSENT_FORM:
                $uploadedFiles = !empty($newDetails["consentForm"]) ? array_filter($newDetails["consentForm"], fn($file) => is_string($file)) : [];
                $files = array_merge($uploadedFiles, $this->uploadFileService->init("Order/$order->id/", "consentForm"));
                $order->fill([
                    "consents" => [
                        ...$order->consents,
                        "consentForm" => $files
                    ],
                ]);
        }

        $order->step = $step->next();
        return $order->save();
    }

    /**
     * Get List of Order Method Ids
     *
     * @param Order $order
     * @return array
     */

    private function getOrderItemsIds(Order $order): array
    {
        return $order->OrderItems()->select("id")->get()->toArray();
    }


    /**
     * @param Order $order
     * @return int
     */
    public function deleteAllOrderItems(Order $order): int
    {
        return $order->OrderItems()->delete();
    }

    public function getUserOrders(array $queryData = [])
    {
        $this->query = auth()->user()->Orders()->getQuery();
        return $this->list($queryData);
    }

    private function testMethodUpdate(Order $order, array $tests)
    {
        $order->Tests()->sync(array_map(fn($test) => $test["id"], $tests));
    }

    private function getForms(array $testsList, Order $order = null)
    {
        $tests = array_map(fn($test) => $test["id"], $testsList);
        if ($order) {
            $newForms = $order->orderForms;
            $testsIds = $order->Tests()->get(["tests.id"])->pluck("id")->toArray();
            if (count($diff = array_diff($tests, $testsIds))) {
                $forms = $this->orderFormRepository->getAll(["filters" => ["tests" => $diff]])->toArray();
                $newForms = array_merge($forms, $newForms);
            }
            if (count($diff = array_diff($testsIds, $tests))) {
                $forms = $this->orderFormRepository->getAll(["filters" => ["tests" => $diff]])->pluck("id")->toArray();
                $newForms = array_filter($newForms, fn($a) => !in_array($a["id"], $forms));
            }
            return $newForms;

        } else {
            return $this->orderFormRepository->getAll(["filters" => ["tests" => $tests]]);
        }
    }

    protected function createSample($sampleDetails, SampleType $sampleType)
    {
        $sample = new Sample($sampleDetails);
        $sample->SampleType()->associate($sampleType->id);

        // Associate patient if provided
        if (isset($sampleDetails["patient_id"])) {
            $sample->Patient()->associate($sampleDetails["patient_id"]);
        }

        if ($sampleType->sample_id_required) {
            $material = Material::where("barcode", $sampleDetails["sampleId"])->first();
            if ($material) {
                $sample->Material()->associate($material->id);
            } else {
                throw new \Exception("Material with barcode '{$sampleDetails["sampleId"]}' not found.");
            }
        } else {
            $sample->Material()->dissociate();
        }
        $sample->save();

        // Attach to order item using pivot table if provided
        if (isset($sampleDetails["order_item_id"])) {
            $sample->OrderItems()->attach($sampleDetails["order_item_id"]);
        }

        return $sample;
    }

    /**
     * @throws \Exception
     */
    public function createOrderByBarcode(string $barcode, array $tests): Order
    {
        $material = $this->materialRepository->getByBarcode($barcode);
        $order = $this->create(["tests" => $tests]);
        $order->load("OrderItems");
        $this->createSample(["sampleId" => $barcode, "order_item_id"=>$order->OrderItems?->first()->id], $material->sampleType);

        return $order;
    }
}
