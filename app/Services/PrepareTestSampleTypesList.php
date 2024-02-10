<?php

namespace App\Services;


use Illuminate\Database\Eloquent\Collection;

class PrepareTestSampleTypesList
{
    public static function do(array $sampleTypes): array
    {
        $output = [];
        foreach ($sampleTypes as $sampleType) {
            $output[] = [
                "sampleType" => [
                    "id" => $sampleType["id"],
                    "name" => $sampleType["name"]
                ],
                "id" => $sampleType["pivot"]["id"],
                "is_default" => $sampleType["pivot"]["is_default"],
                "description" => $sampleType["pivot"]["description"],
            ];
        }
        return $output;
    }

}
