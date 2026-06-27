<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Test;
use App\Models\User;
use Inertia\Inertia;

class EditUserTestsListController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(User $user)
    {
        $user->load('Tests');

        $tests = Test::query()
            ->select(['id', 'name', 'code', 'shortName', 'is_active'])
            ->where('is_active', true)
            ->orWhereIn('id', $user->Tests->pluck('id'))
            ->orderBy('name')
            ->get();

        return Inertia::render('User/Test', ['user' => $user, 'tests' => $tests]);
    }
}
