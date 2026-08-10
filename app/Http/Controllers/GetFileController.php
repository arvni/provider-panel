<?php

namespace App\Http\Controllers;

use App\Interfaces\ConsentRepositoryInterface;
use App\Interfaces\InstructionRepositoryInterface;
use App\Interfaces\OrderFormRepositoryInterface;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\Order;
use App\Repositories\OrderRepository;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GetFileController extends Controller
{
    protected ConsentRepositoryInterface $consentRepository;

    protected InstructionRepositoryInterface $instructionRepository;

    protected OrderFormRepositoryInterface $orderFormRepository;

    protected OrderRepository $orderRepository;

    public function __construct(
        ConsentRepositoryInterface $consentRepository,
        OrderFormRepositoryInterface $orderFormRepository,
        OrderRepositoryInterface $orderRepository,
        InstructionRepositoryInterface $instructionRepository,
    ) {
        $this->consentRepository = $consentRepository;
        $this->orderFormRepository = $orderFormRepository;
        $this->orderRepository = $orderRepository;
        $this->instructionRepository = $instructionRepository;
    }

    /**
     * Handle the incoming request.
     *
     * Authenticated providers may read the shared catalog content (consent,
     * instruction and order-form templates). Order files are private, so they
     * are gated by the OrderPolicy so a provider can only read their own.
     */
    public function __invoke(string $type, int $id, string $filename = ''): BinaryFileResponse
    {
        $repository = str("$type")->camel().'Repository';
        $model = null;
        if (property_exists($this, $repository)) {
            $model = $this->$repository->getById($id);
        }
        abort_if(! $model, 404);

        // Order files belong to a single provider; everything else served here
        // is shared catalog content available to any authenticated provider.
        if ($model instanceof Order) {
            $this->authorize('view', $model);
        }

        if ($filename) {
            // basename() strips any path so the id-scoped directory cannot be escaped.
            $file = "{$type}/$id/".basename($filename);
        } else {
            $file = $model->file;
        }
        $absolutePath = storage_path('app/'.$file);
        // Serve only an existing regular file (never a directory or a missing path).
        abort_unless(is_file($absolutePath), 404);

        // download() sends Content-Disposition: attachment, and nosniff stops the
        // browser second-guessing the type, so stored content can never run in
        // the app's origin even if something unexpected made it onto disk.
        return Response::download($absolutePath, null, [
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'X-Content-Type-Options' => 'nosniff',
        ], null);
    }
}
