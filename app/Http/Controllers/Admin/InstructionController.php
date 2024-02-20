<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInstructionRequest;
use App\Http\Requests\UpdateInstructionRequest;
use App\Http\Resources\InstructionResource;
use App\Interfaces\InstructionRepositoryInterface;
use App\Models\Instruction;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructionController extends Controller
{
    protected InstructionRepositoryInterface $instructionRepository;

    public function __construct(InstructionRepositoryInterface $instructionRepository)
    {
        $this->instructionRepository = $instructionRepository;
        $this->middleware("indexProvider")->only("index");
    }


    /**
     * Display a listing of the instructions.
     *
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Instruction::class);
        $instructions = $this->instructionRepository->list($request->all());
        return Inertia::render("Instruction/Index", ["instructions" => $instructions, "request" => $request->all()]);
    }

    /**
     * Store a newly created instruction.
     *
     * @param StoreInstructionRequest $request
     * @return RedirectResponse
     */
    public function store(StoreInstructionRequest $request): RedirectResponse
    {
        $this->instructionRepository->create($request->all());
        return redirect()->back()->with(["status" => __("messages.successfullyAdded", ["type" => "Instruction", "title" => $request->get("name")])]);
    }

    /**
     * Display the specified instruction.
     *
     * @param Instruction $instruction
     * @return InstructionResource
     * @throws AuthorizationException
     */
    public function show(Instruction $instruction): InstructionResource
    {
        $this->authorize("view", $instruction);
        return new InstructionResource($this->instructionRepository->show($instruction));
    }

    /**
     * Update the specified instruction.
     * @param UpdateInstructionRequest $request
     * @param Instruction $instruction
     * @return RedirectResponse
     */
    public function update(UpdateInstructionRequest $request, Instruction $instruction): RedirectResponse
    {
        $this->instructionRepository->update($instruction, $request->all());
        return redirect()->back()->with(["status" => __("messages.successfullyUpdated", ["type" => "Instruction", "title" => $request->get("name")])]);
    }

    /**
     * Remove the specified instruction.
     *
     * @param Instruction $instruction
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(Instruction $instruction): RedirectResponse
    {
        $this->authorize("delete", $instruction);
        $title = $instruction->name;
        if ($this->instructionRepository->delete($instruction))
            return redirect()->back()->with(["status" => __("messages.successfullyDeleted", ["type" => "Instruction", "title" => $title])]);
        return redirect()->back()->withErrors(["error" => "$title instruction can not be deleted"]);
    }
}
