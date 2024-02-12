<?php

namespace App\Services;

use App\Models\CollectRequest;
use Carbon\Carbon;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class RequestLogistic
{


    public static function send(CollectRequest $collectRequest): PromiseInterface|Response
    {
        $collectRequest->load(["Orders.Samples.SampleType", "Orders.Tests", "Orders.Patient", "User"]);

        // Prepare JSON data
        $jsonData = [
            "orders" => []
        ];
        $request = Http::withToken(ApiService::getApiToken())->timeout(180)->asMultipart();
        foreach ($collectRequest->Orders as $order) {
            $id="OR". Carbon::parse($order->created_at)->format(".Ymd.").$order->id;
            $orderData = [
                    "orderForms" => collect($order->orderForms)->mapWithKeys(function ($item) {
                        return [$item["name"] => $item["formData"]];
                    })->toArray(),
                    "patient" => $order->Patient->toArray(),
                    "samples" => $order->Samples->toArray(),
                    "tests" => $order->Tests->toArray()
            ];

            $jsonData["orders"][$id] = $orderData;
            $counter = 0;
            foreach ($order->files as $file) {
                $filePath = storage_path("app/$file");
                $fileName = basename($filePath);
                $fileContents = file_get_contents($filePath);
                if ($fileContents !== false) {
                    $request->attach("file[$id][$counter]", $fileContents, $fileName);
                }
                $counter++;
            }
        }

        $jsonString = json_encode($jsonData);
        $request->attach("data", $jsonString, 'data.json');
        // Send the POST request with JSON data
        return $request->post(config("api.server_url") . config("api.logistic_request").$collectRequest->User->id);
    }
}

