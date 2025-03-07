<?php

namespace SciFY\LaravelCookiesConsent\View\Components;

use Illuminate\View\Component;

class LaravelCookiesConsent extends Component {
    public function render() {
        return view('cookies_consent::components.laravel-cookie-guard');
    }
}
