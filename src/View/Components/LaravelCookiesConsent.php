<?php

namespace SciFY\LaravelCookiesConsent\View\Components;

use Illuminate\View\Component;

class LaravelCookiesConsent extends Component {
    public function __construct(public string $heading = 'h2', public string $accordionHeading = 'h5') {}

    public function render() {
        return view('cookies_consent::components.laravel-cookie-guard');
    }
}
