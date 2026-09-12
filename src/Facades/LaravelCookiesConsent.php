<?php

declare(strict_types=1);

namespace SciFY\LaravelCookiesConsent\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @see \SciFY\LaravelCookiesConsent\LaravelCookiesConsent
 */
class LaravelCookiesConsent extends Facade {
    protected static function getFacadeAccessor() {
        return \SciFY\LaravelCookiesConsent\LaravelCookiesConsent::class;
    }
}
