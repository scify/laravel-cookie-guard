<link rel="stylesheet" href="{{ asset('vendor/scify/laravel-cookie-guard/_variables.css') }}?v={{ filemtime(public_path('vendor/scify/laravel-cookie-guard/_variables.css')) }}">
<link rel="stylesheet" href="{{ asset('vendor/scify/laravel-cookie-guard/styles.css') }}?v={{ filemtime(public_path('vendor/scify/laravel-cookie-guard/styles.css')) }}">
<script>
    window.cookies_consent_translations = {
        read_more: "{{ __('cookies_consent::messages.read_more') }}",
        read_less: "{{ __('cookies_consent::messages.read_less') }}"
    };
</script>
<script src="{{ asset('vendor/scify/laravel-cookie-guard/scripts.js') }}?v={{ filemtime(public_path('vendor/scify/laravel-cookie-guard/scripts.js')) }}"></script>
