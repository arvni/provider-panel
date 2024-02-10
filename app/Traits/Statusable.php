<?php

namespace App\Traits;

trait Statusable
{
    public function scopeStatus($query, $status, $field = "status")
    {
        $table = "";
        if (count(func_get_args())<4)
            $table = $this->getTable().".";
        return $query->where("$table$field", $status);
    }

}
