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
        }

        @media only screen and (max-width: 640px) {
            .inner-body {
                width: 100% !important;
                border-radius: 0 !important;
            }

            .footer {
                width: 100% !important;
            }

            .content-cell {
                padding: 28px 22px !important;
            }

            .logo {
                width: 170px !important;
                max-width: 170px !important;
            }
        }

        table {
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
            -premailer-width: 100%;
        }

        p {
            color: #475569;
            font-size: 16px;
            line-height: 1.65em;
            margin-top: 0;
            margin-bottom: 18px;
            text-align: left;
        }

        h1 {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.2px;
            margin-top: 0;
            margin-bottom: 18px;
            text-align: left;
        }
    </style>
</head>

<body
    style="-webkit-text-size-adjust: none; background-color: #f1f5f9; color: #475569; height:100%; line-height: 1.6; margin: 0; padding: 0; width: 100% !important;">

<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation"
       style="background-color: #f1f5f9; margin: 0; padding: 0; width: 100%;">
    <tr>
        <td align="center">
            <table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation"
                   style="margin: 0; padding: 0; width: 100%;">
                <tr>
                    <td class="header" style="padding: 36px 0 28px; text-align: center;">
                        <a href="{{config("app.url")}}"
                           style="color: #0f172a; font-size: 15px; font-weight: 600; text-decoration: none; display: block;">
                            <img src="{{url("images/logo.png")}}" class="logo" width="220"
                                 alt="{{config('app.name')}}"
                                 style="display: block; width: 220px; max-width: 220px; height: auto; margin: 0 auto;">
                            <span
                                style="display: block; margin-top: 14px; color: #64748b; font-size: 14px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase;">{{ config('app.name') }}</span>
                        </a>
                    </td>
                </tr>

                <!-- Email Body -->
                <tr>
                    <td class="body" width="100%" cellpadding="0"
                        style="-premailer-width: 100%; background-color: #f1f5f9; border: hidden !important;">
                        <table class="inner-body" align="center" width="600" cellpadding="0" cellspacing="0"
                               role="presentation"
                               style="-premailer-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.05); margin: 0 auto; padding: 0; width: 600px;">
                            <!-- Body content -->
                            <tr>
                                <td class="content-cell" style="max-width: 100vw; padding: 40px;">
                                    <h1>Hello!</h1>
                                    <p>{{"$orderMaterial->user_name Ordered $orderMaterial->amount, of $orderMaterial->sample_type_name"}}</p>
                                    <p>Thank you for choosing us!</p>
                                    <p>Regards,<br>Bion Provider Panel</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td>
                        <table class="footer" align="center" width="600" cellpadding="0" cellspacing="0"
                               role="presentation"
                               style="-premailer-width: 600px; margin: 0 auto; padding: 0; text-align: center; width: 600px;">
                            <tr>
                                <td class="content-cell" align="center"
                                    style="max-width: 100vw; padding: 28px 40px 36px;">
                                    <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6em; text-align: center;">
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
