<?php

namespace SciFY\LaravelCookiesConsent\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Manages the cookies consent submission
 */
class CookiesController extends Controller {
    /**
     * Called when the user clicks on "ACCEPT SELECTION".
     * Accepts one boolean per configured cookie category plus the locale,
     * drops anything else, and echoes the accepted selection back. The
     * consent cookie itself is written by the browser.
     *
     * @return JsonResponse the result of the operation
     */
    public function save_cookies_consent_selection(Request $request): JsonResponse {
        $data = $request->validate($this->consentRules());

        foreach (config()->array('cookies_consent.required') as $category) {
            $data[$category] = true;
        }

        // get the message for the specific locale
        $message = __('cookies_consent::messages.selection_saved_message', [], $this->getRequestLocale($request));

        return response()->json(['message' => $message, 'data' => $data, 'success' => true]);
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function consentRules(): array {
        $rules = ['locale' => ['sometimes', 'nullable', 'string']];

        foreach (array_keys(config()->array('cookies_consent.cookies')) as $category) {
            $rules[(string) $category] = ['sometimes', 'boolean'];
        }

        return $rules;
    }

    /**
     * The locale comes from the request body and ends up in a translation
     * file path, so only a well-formed locale identifier is accepted
     * (e.g. "en", "pt-br", "zh_Hant_TW"). Anything else falls back to the
     * application locale.
     */
    private function getRequestLocale(Request $request): ?string {
        $locale = $request->input('locale');

        if (! is_string($locale) || preg_match('/^[a-z]{2,3}(?:[_-][a-z0-9]{2,8})*$/i', $locale) !== 1) {
            return null;
        }

        return $locale;
    }
}
