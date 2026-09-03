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
        Cookie::queue($this->get_cookie_prefix() . 'cookies_consent_selection', json_encode($data), self::$MINUTES_IN_A_DAY * config()->integer('cookies_consent.cookie_lifetime'));

        // get the message for the specific locale
        $message = __('cookies_consent::messages.selection_saved_message', [], $this->get_request_locale($request));

        return response()->json(['message' => $message, 'data' => $data, 'success' => true]);
    }

    /**
     * The locale comes from the request body and ends up in a translation
     * file path, so only a well-formed locale identifier is accepted
     * (e.g. "en", "pt-br", "zh_Hant_TW"). Anything else falls back to the
     * application locale.
     */
    private function get_request_locale(Request $request): ?string {
        $locale = $request->input('locale');

        if (! is_string($locale) || preg_match('/^[a-z]{2,3}(?:[_-][a-z0-9]{2,8})*$/i', $locale) !== 1) {
            return null;
        }

        return $locale;
    }

    private function get_cookie_prefix(): string {
        return config()->string('cookies_consent.cookie_prefix');
    }
}
