<?php

namespace SciFY\LaravelCookiesConsent\View\Components;

use Illuminate\View\Component;

class LaravelCookiesConsent extends Component {
    public $heading;

    public $accordionHeading;

    public function __construct($heading = 'h2', $accordionHeading = 'h5') {
        $this->heading = $heading;
        $this->accordionHeading = $accordionHeading;
    }

    public function render() {
        return view('cookies_consent::components.laravel-cookie-guard');
    }
}
