<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <style>
        body {
            padding: 0;
            margin: 0;
        }

        @media print {
            @page {
                size: 35mm 20mm;
            }
        }

        .container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            align-content: center;
        }

        .barcode {
            padding-top: 2mm;
            text-align: center;
            margin: auto;
            display: flex;
            flex-direction: column;
            align-content: center;
            align-items: center;
            page-break-after: always;
        }

        p {
            margin: 1px;
            font-weight: bold;
            font-size: 2.5mm;
            font-family: monospace;
            letter-spacing: .15mm;
            text-transform: uppercase;
        }
    </style>
    <script>
        window.print();
    </script>
</head>

<body>
<div class="container">
    @foreach($orderMaterial->materials as $barcode)
        <div class="barcode">
            {!! \DNS1D::getBarcodeHTML($barcode->barcode, 'C128',1,30,"black", false) !!}
            <p>{{$barcode->barcode}}</p>
            <p>{{ Carbon\Carbon::parse($barcode->expireDate)->format("Y-m-d") }}</p>
            <p>{{$barcode->SampleType->name}}</p>
        </div>
    @endforeach
</div>
</body>
</html>
