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

    public function __construct(Order                            $order,
                                OrderFormRepositoryInterface     $orderFormRepository,
                                UploadFileService                $uploadFileService,
                                materialRepositoryInterface $materialRepository)
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
            ->withAggregate("Patient", "fullName")
            ->withAggregate("Patient", "reference_id")
            ->withAggregate("Patient", "dateOfBirth")
            ->withAggregate("Samples", "sampleId");

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
            ->with("Tests:id,name",)
            ->withAggregate("User", "name")
            ->withAggregate("Patient", "fullName")
            ->withAggregate("Patient", "reference_id")
            ->withAggregate("Patient", "dateOfBirth")
            ->withAggregate("Samples", "sampleId");

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
            ->select(["id", "patient_id", "updated_at", "created_at", "status","user_id"])
            ->where("user_id",auth()->user()->id)
            ->withAggregate("Tests", "name")
            ->withAggregate("Patient", "fullName")
            ->latest()
            ->limit(5)
            ->get();
    }

    public function notDownloadedOrdersReportCount()
    {
        return $this->query
            ->where("user_id",auth()->user()->id)
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
                if (isset($newDetails["id"])) {
                    $patient = Patient::find($newDetails["id"]);
                    $patient->fill([
                        "fullName" => $newDetails["fullName"],
                        "nationality" => $newDetails["nationality"]["code"],
                        "dateOfBirth" => $newDetails["dateOfBirth"],
                        "gender" => $newDetails["gender"],
                        "consanguineousParents" => $newDetails["consanguineousParents"],
                        "contact" => $newDetails["contact"] ?? null,
                        "extra" => $newDetails["extra"] ?? null,
                        "isFetus" => $newDetails["isFetus"] ?? false,
                        "reference_id" => $newDetails["reference_id"] ?? null
                    ]);
                    if ($patient->isDirty())
                        $patient->save();
                    $order->Patient()->associate($newDetails["id"]);
                } else {
                    $patient = new Patient(
                        [
                            "fullName" => $newDetails["fullName"],
                            "nationality" => $newDetails["nationality"]["code"],
                            "dateOfBirth" => $newDetails["dateOfBirth"],
                            "gender" => $newDetails["gender"],
                            "consanguineousParents" => $newDetails["consanguineousParents"],
                            "contact" => $newDetails["contact"] ?? null,
                            "extra" => $newDetails["extra"] ?? null,
                            "isFetus" => $newDetails["isFetus"] ?? false,
                            "reference_id" => $newDetails["reference_id"] ?? null
                        ]
                    );
                    auth()->user()->Patients()->save($patient);
                    $order->Patient()->associate($patient);
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
                        if ($sampleType->sample_id_required) {
                            $material = Material::where("barcode", $sampleDetails["sampleId"])->first();
                            $sample->Material()->associate($material->id);
                        } else
                            $sample->Material()->disAssociate();
                        if ($sample->isDirty())
                            $sample->save();
                        $samplesIds[] = $sample->id;
                    } else {
                       $sample=$this->createSample($sampleDetails,$order,$sampleType);
                        $samplesIds[] = $sample->id;
                    }
                }
                $order->Samples()->whereNotIn("id", $samplesIds)->delete();
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

    protected function createSample($sampleDetails,Order $order,SampleType $sampleType)
    {
        $sample = new Sample($sampleDetails);
        $sample->SampleType()->associate($sampleType->id);
        $sample->Order()->associate($order->id);
        if ($sampleType->sample_id_required) {
            $material = Material::where("barcode", $sampleDetails["sampleId"])->first();
            $sample->Material()->associate($material->id);
        } else
            $sample->Material()->disAssociate();
        $sample->save();
        return $sample;
    }

    public function createOrderByBarcode(string $barcode): Order
    {
        $material = $this->materialRepository->getByBarcode($barcode);
        $order=$this->create(["tests"=>[$material->sampleType->defaultTest->test]]);
        $this->createSample(["sampleId"=>$barcode],$order,$material->sampleType);
        return $order;
    }
}
