<x-mail::layout>
    {{-- Header --}}
    <x-slot:header>
        <x-mail::header :url="config('app.url')">
            <div style="display: flex;flex-direction: column;justify-content: center;gap: 10px;align-items: center">
                <img src="{{url("images/logo.png")}}" width="50" alt="{{config('app.name')}}">
                <span>{{ config('app.name') }}</span>
            </div>
        </x-mail::header>
    </x-slot:header>

    {{-- Body --}}
    {{ $slot }}

    {{-- Subcopy --}}
    @isset($subcopy)
        <x-slot:subcopy>
            <x-mail::subcopy>
                {{ $subcopy }}
            </x-mail::subcopy>
        </x-slot:subcopy>
    @endisset

    {{-- Footer --}}
    <x-slot:footer>
        <x-mail::footer>
            © {{ date('Y') }} {{ config('app.name') }}. @lang('All rights reserved.')
        </x-mail::footer>
    </x-slot:footer>
</x-mail::layout>
