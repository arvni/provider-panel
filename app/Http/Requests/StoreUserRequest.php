<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Request;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @param Request $request
     * @return bool
     */
    public function authorize(Request $request)
    {
        return Gate::allows("create", User::class);
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
            'userName' => "required|unique:users,userName",
            'mobile' => "required",
            'email' => [
                "required",
                "email:rfc,dns",
                "unique:users,email"
            ],
            'password' => "required|min:6|confirmed",
            'roles.*.id' => 'required|exists:roles,id',
        ];
    }
}
