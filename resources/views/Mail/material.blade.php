<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>{{config("app.name")}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
        * {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            box-sizing: border-box;
            position: relative;
        }

        @media only screen and (max-width: 600px) {
            .inner-body {
                width: 100% !important;
            }

            .footer {
                width: 100% !important;
            }
        }

        table {
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
            -premailer-width: 100%;
        }

        p {
            font-size: 16px;
            line-height: 1.5em;
            margin-top: 0;
            text-align: left;
        }

        h1 {
            color: #3d4852;
            font-size: 18px;
            font-weight: bold;
            margin-top: 0;
            text-align: left;
        }
    </style>
</head>
=

<body
    style="  -webkit-text-size-adjust: none; background-color: #ffffff; color: #718096; height:100%; line-height: 1.4; margin: 0; padding: 0; width: 100% !important;">

<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation"
       style="background-color: #edf2f7; margin: 0; padding: 0; width: 100%;">
    <tr>
        <td align="center">
            <table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation"
                   style="margin: 0; padding: 0; width: 100%;">
                <tr>
                    <td class="header"
                        style=" position:relative; padding: 25px 0; text-align: center;">
                        <a href="{{config("app.url")}}"
                           style="  color: #3d4852; font-size: 19px; font-weight: bold; text-decoration: none; display: inline-block;">
                            <div
                                style="  position:relative; display: flex; flex-direction: column; justify-content: center; gap: 10px; align-items: center;">
                                <img src="{{url("images/logo.png")}}" width="50" alt="{{config('app.name')}}">
                                <span>{{ config('app.name') }}</span>
                            </div>
                        </a>

                    </td>
                </tr>

                <!-- Email Body -->
                <tr>
                    <td class="body" width="100%" cellpadding="0"
                        style=" -premailer-width: 100%; background-color: #edf2f7;border: hidden !important;">
                        <table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0"
                               role="presentation"
                               style="-premailer-width: 570px; background-color: #ffffff; border-color: #e8e5ef; border-radius: 2px; border-width: 1px; box-shadow: 0 2px 0 rgba(0, 0, 150, 0.025), 2px 4px 0 rgba(0, 0,150, 0.015); margin: 0 auto; padding: 0; width: 570px;">
                            <!-- Body content -->
                            <tr>
                                <td class="content-cell"
                                    style="max-width: 100vw; padding: 32px;">
                                    <h1>Hello!</h1>
                                    <p>{{"$orderMaterial->user_name Ordered $orderMaterial->amount, of $orderMaterial->sample_type_name"}}</p>
                                    <p>
                                        Thank you for choosing us!</p>
                                    <p>Regards,<br>Bion Provider Panel</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td style="  ">
                        <table class="footer" align="center" width="570" cellpadding="0" cellspacing="0"
                               role="presentation"
                               style="-premailer-width: 570px; margin: 0 auto; padding: 0; text-align: center; width: 570px;">

                            <tr>
                                <td class="content-cell" align="center"
                                    style="max-width: 100vw; padding: 32px;">
                                    <p style="margin-top: 0; color: #b0adc5; font-size: 12px; text-align: center;">
                                        © {{ date('Y') }} {{ config('app.name') }}. @lang('All rights reserved.')
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
