<?php

namespace App\Policies;

use App\Models\PreOrder;
use App\Models\User;

class PreOrderPolicy
{
    /** A center sees and acts on its own pre-orders only. */
    public function view(User $user, PreOrder $preOrder): bool
    {
        return $user->hasAccess('PreOrder.Index') && $preOrder->user_id === $user->id;
    }

    public function act(User $user, PreOrder $preOrder): bool
    {
        return $user->hasAccess('PreOrder.Create') && $preOrder->user_id === $user->id;
    }

    /** Approve, partly approve or reject a quotation. Granted per user, not by the provider role. */
    public function approveFinance(User $user, PreOrder $preOrder): bool
    {
        return $user->hasAccess('PreOrder.Approve Finance') && $preOrder->user_id === $user->id;
    }
}
