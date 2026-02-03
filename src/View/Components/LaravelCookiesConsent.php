<?php

namespace SciFY\LaravelCookiesConsent\View\Components;

use Illuminate\View\Component;

class LaravelCookiesConsent extends Component {
    public function __construct(public $heading = 'h2', public $accordionHeading = 'h5') {}

    public function render() {
        return view('cookies_consent::components.laravel-cookie-guard');
    }
}
