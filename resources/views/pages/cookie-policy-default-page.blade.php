<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __('cookies_consent::messages.cookie_policy_title') }}</title>
    <link rel="stylesheet" href="{{ asset('vendor/scify/laravel-cookie-guard/styles.css') }}">
    @include('cookies_consent::components.laravel-cookie-guard-scripts')
</head>

<body class="scify-cookie-policy-page">
    <div class="container p-5">
        <div class="row">
            <div class="col-lg-9 col-sm-12 mx-auto my-3">
                <a href="javascript:window.close()" class="btn btn-secondary text-lg">
                    <svg id="Capa_1" enable-background="new 0 0 320.591 320.591" height="20"
                        viewBox="0 0 320.591 320.591" width="20" xmlns="http://www.w3.org/2000/svg"
                        class="close-icon">
                        <g>
                            <g id="close_1_">
                                <path fill="currentColor"
                                    d="m30.391 318.583c-7.86.457-15.59-2.156-21.56-7.288-11.774-11.844-11.774-30.973 0-42.817l257.812-257.813c12.246-11.459 31.462-10.822 42.921 1.424 10.362 11.074 10.966 28.095 1.414 39.875l-259.331 259.331c-5.893 5.058-13.499 7.666-21.256 7.288z" />
                                <path fill="currentColor"
                                    d="m287.9 318.583c-7.966-.034-15.601-3.196-21.257-8.806l-257.813-257.814c-10.908-12.738-9.425-31.908 3.313-42.817 11.369-9.736 28.136-9.736 39.504 0l259.331 257.813c12.243 11.462 12.876 30.679 1.414 42.922-.456.487-.927.958-1.414 1.414-6.35 5.522-14.707 8.161-23.078 7.288z" />
                            </g>
                        </g>
                    </svg>
                    Close Page
                </a>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-9 col-sm-12 mx-auto">
                @include('cookies_consent::components.laravel-cookie-guard-page')
            </div>
        </div>
    </div>
</body>

</html>
