<?php


namespace App\Interfaces;


use App\Models\Instruction;

interface InstructionRepositoryInterface
{
    public function list(array $queryData);
    public function getAll(array $queryData);
    public function create($instructionDetails);
    public function show(Instruction $instruction);
    public function update(Instruction $instruction, $newInstructionDetails);
    public function delete(Instruction $instruction);
    public function getById(int $id);
}
