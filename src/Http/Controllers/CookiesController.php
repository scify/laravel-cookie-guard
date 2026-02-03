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
    private static int $MINUTES_IN_A_DAY = 1440;

    /**
     * Called when the user clicks on "ACCEPT SELECTION"
     * This method goes over all the input fields (checkboxes)
     * submitted by the cookies consent form, and stores
     * all the relevant cookies.
     *
     * @return JsonResponse the result of the operation
     */
    public function save_cookies_consent_selection(Request $request): JsonResponse {
        $data = $request->all();
        // store the JSON in a cookie
        Cookie::queue($this->get_cookie_prefix() . 'cookies_consent_selection', json_encode($data), (self::$MINUTES_IN_A_DAY * config('cookies_consent.cookie_lifetime')));

        $locale = $request->get('locale');

        // get the message for the specific locale
        $message = __('cookies_consent::messages.selection_saved_message', [], $locale);

        return response()->json(['message' => $message, 'data' => $data, 'success' => true]);
    }

    private function get_cookie_prefix(): string {
        return config('cookies_consent.cookie_prefix');
    }
}
