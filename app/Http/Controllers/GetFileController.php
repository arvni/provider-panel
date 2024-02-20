<?php

namespace App\Http\Controllers;

use App\Interfaces\ConsentRepositoryInterface;
use App\Interfaces\InstructionRepositoryInterface;
use App\Interfaces\OrderFormRepositoryInterface;
use App\Interfaces\OrderRepositoryInterface;
use App\Repositories\OrderRepository;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use function PHPUnit\Framework\directoryExists;

class GetFileController extends Controller
{
    protected ConsentRepositoryInterface $consentRepository;
    protected InstructionRepositoryInterface $instructionRepository;
    protected OrderFormRepositoryInterface $orderFormRepository;
    protected OrderRepository $orderRepository;

    public function __construct(
        ConsentRepositoryInterface   $consentRepository,
        OrderFormRepositoryInterface $orderFormRepository,
        OrderRepositoryInterface     $orderRepository,
        InstructionRepositoryInterface     $instructionRepository,
    )
    {
        $this->consentRepository = $consentRepository;
        $this->orderFormRepository = $orderFormRepository;
        $this->orderRepository = $orderRepository;
        $this->instructionRepository=$instructionRepository;
    }

    /**
     * Handle the incoming request.
     * @param string $type
     * @param int $id
     * @param string $filename
     * @return BinaryFileResponse
     *
     *  @todo check files owner
     *
     */
    public function __invoke(string $type, int $id, string $filename = ""): BinaryFileResponse
    {
        $repository = str("$type")->camel() . "Repository";
        $model = null;
        if (property_exists($this, $repository)) {
            $model = $this->$repository->getById($id);
        }
        abort_if(!$model, 404);
        if ($filename) {
            $file = "{$type}/$id/$filename";
        } else
            $file = $model->file;
        abort_if((!file_exists(storage_path("app/" . $file))) xor is_dir(storage_path("app/" . $file)), 404);
        return Response::download(storage_path("app/" . $file), null, [
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ], null);
    }
}
