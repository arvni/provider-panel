<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;


class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return Gate::allows("update", $this->route("user"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'name' => "required",
            'mobile' => "required",
            'email' => [
                "required",
                "email:rfc,dns",
                "unique:users,email," . $this->route("user")->id
            ],
            'roles.*.id' => 'required|exists:roles,id',
            'userName' => "required|unique:users,userName," . $this->route("user")->id,
        ];
    }
}
