<?php

use Illuminate\Support\Facades\Route;
use SciFY\LaravelCookiesConsent\Http\Controllers\CookiesController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where the routes of the package are defined
|
*/

Route::get('/cookie-policy/{locale}', function (string $locale) {
    app()->setLocale($locale);

    return view('cookies_consent::cookie-policy');
});

Route::post('/cookie-consent/save', [CookiesController::class, 'save_cookies_consent_selection']);
