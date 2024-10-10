<?php

namespace SciFY\LaravelCookiesConsent\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cookie;

/**
 * Manages the cookies consent submission
 */
class CookiesController extends Controller {
    private static $MINUTES_IN_A_DAY = 1440;

    /**
     * Called when the user clicks on "ACCEPT SELECTION"
     * This method goes over all the input fields (checkboxes)
     * submitted by the cookies consent form, and stores
     * all the relevant cookies.
     *
     * @return JsonResponse the result of the operation
     */
    public function save_cookies_consent_selection(Request $request): JsonResponse {
        $this->set_cookies_consent_basic_cookie();
        $data = $request->all();
        foreach ($data as $key => $value) {
            if (strpos($key, 'cookies_consent_') !== false) {
                $this->set_cookie($key);
            } else {
                $this->delete_cookie($key);
            }
        }

        return response()->json(['message' => 'Cookies consent selection saved', 'data' => $data, 'success' => true]);
    }

    /**
     * Sets the basic cookie, identifying that the user has
     * already submitted a certain cookie selection.
     *
     * @return void
     */
    public function set_cookies_consent_basic_cookie() {
        $this->set_cookie('cookies_consent_selection');
    }

    /**
     * Sets a cookie
     *
     * @param  $cookie_name  string the cookie name
     * @return void
     */
    public function set_cookie(string $cookie_name) {
        Cookie::queue($this->get_cookie_prefix() . $cookie_name, true, (self::$MINUTES_IN_A_DAY * config('cookies_consent.cookie_lifetime')));
    }

    /**
     * Deletes a cookie
     *
     * @param  $cookie_name  string the cookie name
     * @return void
     */
    public function delete_cookie(string $cookie_name) {
        Cookie::queue(Cookie::forget($this->get_cookie_prefix() . $cookie_name));
    }

    private function get_cookie_prefix(): string {
        return config('cookies_consent.cookie_prefix');
    }
}
