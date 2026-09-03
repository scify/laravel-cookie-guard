<?php

use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
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

Route::get('/cookie-policy/{locale}', function (string $locale): Factory|View {
    app()->setLocale($locale);

    return view('cookies_consent::pages.cookie-policy-default-page');
})->where('locale', '[A-Za-z]{2,3}(?:[_-][A-Za-z0-9]{2,8})*');

Route::post('/guard-settings/save', [CookiesController::class, 'save_cookies_consent_selection']);
