<?php

namespace App\Http\Requests;

use App\Enums\CollectRequestStatus;
use App\Models\CollectRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateCollectRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update",$this->route()->parameter("collectRequest"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            "status"=>["required",Rule::in(CollectRequestStatus::values())],
            "scheduleDate"=>[
                "required_if:status,".CollectRequestStatus::SCHEDULED->value,
                Rule::excludeIf(fn()=>in_array($this->get("status"),collect(CollectRequestStatus::values())->except(CollectRequestStatus::SCHEDULED->value)->toArray())),
                "date",
                "after_or_equal:now"
            ],
            "pickupDate"=>[
                "required_if:status,".CollectRequestStatus::PICKED_UP->value,
                Rule::excludeIf(fn()=>in_array($this->get("status"),collect(CollectRequestStatus::values())->except(CollectRequestStatus::PICKED_UP->value)->toArray())),
                "date",
                "after_or_equal:now"
            ],
        ];
    }
}
