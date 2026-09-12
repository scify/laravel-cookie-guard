import "../styles/styles.scss";

document.addEventListener("DOMContentLoaded", function () {
	initializeAccordionButtons();
	initializeCookieBanner();
	openCookieBannerByHash();
	initializeConsentSettingsLink();
});

/**
 * Opens the cookie banner by hash.
 * @function openCookieBannerByHash
 * @returns {void}
 * @description
 * This function opens the cookie banner by hash.
 * If the hash is #consent-settings, the cookie banner is opened.
 * If the hash is not #consent-settings, the cookie banner is closed.
 */
function openCookieBannerByHash() {
	if (window.location.hash === "#consent-settings") {
		if (typeof window.toggleCookieBanner === "function") {
			window.toggleCookieBanner();
		}
	}
}

/**
 * Initializes the accordion buttons by attaching event listeners to them.
 *
 * @function initializeAccordionButtons
 * @returns {void}
 *
 * @description
 * This function initializes the accordion buttons by attaching event listeners to them.
 */
function initializeAccordionButtons() {
	// Remove existing event listeners to avoid duplication
	document.querySelectorAll(".accordion-button").forEach((button) => {
		button.removeEventListener("click", handleAccordionClick);
	});

	// Attach new event listeners
	document.querySelectorAll(".accordion-button").forEach((button) => {
		button.addEventListener("click", handleAccordionClick);
	});
}

/**
 * Handles the click event on an accordion button.
 *
 * @function handleAccordionClick
 * @param event {Event} The click event
 * @returns {void}
 *
 * @description
 * This function handles the click event on an accordion button.
 */
function handleAccordionClick(event) {
	event.stopPropagation(); // Stop event propagation
	const button = event.currentTarget;
	toggleAccordion(button);
}

/**
 * Toggles the accordion item associated with the clicked button.
 *
 * @param button {Element} The clicked button
 * @returns {void}
 *
 * @description
 * This function toggles the accordion item associated with the clicked button.
 * If the accordion item is already open, it closes it. If it is closed, it opens it.
 * It also closes all other accordion items except the clicked one.
 */
function toggleAccordion(button) {
	const target = document.querySelector(button.dataset.target);

	// Close all accordion items except the clicked one
	document.querySelectorAll(".accordion-collapse").forEach((collapse) => {
		if (collapse !== target) {
			collapse.classList.remove("show");
			const relatedButton = document.querySelector(`[data-target="#${collapse.id}"]`);
			if (relatedButton) {
				relatedButton.classList.add("collapsed");
				if (window.cookies_consent_translations)
					relatedButton.textContent = window.cookies_consent_translations.read_more;
			}
		}
	});

	// Toggle the clicked accordion item
	if (target.classList.contains("show")) {
		// If the accordion is already open, close it
		target.classList.remove("show");
		button.classList.add("collapsed");
		if (window.cookies_consent_translations) button.textContent = window.cookies_consent_translations.read_more;
	} else {
		// If the accordion is closed, open it
		target.classList.add("show");
		button.classList.remove("collapsed");
		if (window.cookies_consent_translations) button.textContent = window.cookies_consent_translations.read_less;
	}
}

/**
 * Initializes the cookie banner by setting up the necessary event listeners and cookie handling.
 *
 * @function initializeCookieBanner
 * @returns {void}
 *
 * @description
 * This function initializes the cookie banner by setting up the necessary event listeners and cookie handling.
 * It also sets the initial state of the banner based on the user's cookie consent.
 * If the user has already accepted the cookies, the banner is hidden.
 * If the user has not accepted the cookies, the banner is displayed
 * and the floating button is shown if the configuration allows it.
 * The cookie settings are stored as a JSON object with the category names as keys and their consent status as values.
 */
function initializeCookieBanner() {
	const cookieBanner = document.getElementById("scify-cookies-consent");
	const cookieButton = document.getElementById("scify-cookie-consent-floating-button");
	const showFloatingButton =
		cookieBanner.dataset.showFloatingButton === "true" || cookieBanner.dataset.showFloatingButton === "1";
	const hideFloatingButtonOnMobile =
		cookieBanner.dataset.hideFloatingButtonOnMobile === "true" ||
		cookieBanner.dataset.hideFloatingButtonOnMobile === "1";
	const cookiePrefix = cookieBanner.dataset.cookiePrefix;
	const cookieConsent = getCookie(cookiePrefix + "cookies_consent");

	initialiseBanner(cookieBanner, cookieButton, showFloatingButton, hideFloatingButtonOnMobile, cookieConsent);
	setSliders(cookieConsent);

	addEventListeners({
		"customise-cookies": handleCustomiseCookies,
		"accept-all-cookies": handleAcceptAllCookies,
		"accept-selected-cookies": handleAcceptSelectedCookies,
		"reject-optional-cookies": handleRejectOptionalCookies,
		"close-cookie-policy-page": handleAcceptSelectedCookies,
	});
}

function addEventListeners(buttonHandlers) {
	for (const [buttonId, handler] of Object.entries(buttonHandlers)) {
		const button = document.getElementById(buttonId);
		if (button) {
			button.addEventListener("click", handler);
		}
	}
}

function initialiseBanner(cookieBanner, cookieButton, showFloatingButton, hideFloatingButtonOnMobile, cookieConsent) {
	if (onCookiesPage()) {
		cookieBanner.style.display = "block";
	} else {
		toggleBannerDisplay(cookieBanner, cookieButton, showFloatingButton, hideFloatingButtonOnMobile, cookieConsent);
	}
}

function toggleBannerDisplay(
	cookieBanner,
	cookieButton,
	showFloatingButton,
	hideFloatingButtonOnMobile,
	cookieConsent,
) {
	const useShowModal = cookieBanner.dataset.useShowModal === "true" || cookieBanner.dataset.useShowModal === "1";
	if (cookieConsent) {
		cookieBanner.style.display = "none";
		if (showFloatingButton && cookieButton) {
			// Hide the floating button on mobile if the configuration allows it
			cookieButton.style.display = hideFloatingButtonOnMobile && window.innerWidth < 768 ? "none" : "block";
		}
	} else {
		cookieBanner.style.display = "block";
		const dialog = cookieBanner.querySelector("dialog");
		if (dialog && useShowModal) {
			dialog.showModal();
		}
	}
}

/**
 * Sets the sliders based on the user's cookie consent.
 * @param cookieConsent {string} The user's cookie consent as a JSON string
 *
 * @function setSliders
 * @returns {void}
 * @description
 * This function sets the sliders based on the user's cookie consent.
 * If the user has already accepted the cookies, the sliders are set according to the consent settings.
 */
function setSliders(cookieConsent) {
	if (cookieConsent) {
		try {
			const consentSettings = JSON.parse(cookieConsent);
			if (consentSettings && Object.keys(consentSettings).length > 0) {
				for (const category in consentSettings) {
					if (consentSettings.hasOwnProperty(category)) {
						const categoryCheckbox = document.getElementById("lcg-" + category);
						if (categoryCheckbox) {
							categoryCheckbox.checked = consentSettings[category];
						}
					}
				}
			}
		} catch (error) {
			console.warn("Error parsing cookie consent JSON:", error);
		}
	}
}

function handleCustomiseCookies() {
	const cookieCategoriesContainer = document.getElementById("cookie-categories-container");
	// remove the "display-none" class to show the cookie categories
	cookieCategoriesContainer.classList.remove("display-none");

	// hide the parent with class "button-col" of the "customise-cookies" button
	document.getElementById("customise-cookies").closest(".button-col").classList.add("display-none");
	// show the "accept-selected-cookies" button
	document.getElementById("accept-selected-cookies").closest(".button-col").classList.remove("display-none");
}

function handleAcceptAllCookies() {
	handleCookieConsent(getConsentSettings(true));
}

function handleAcceptSelectedCookies() {
	handleCookieConsent(getConsentSettings());
}

function handleRejectOptionalCookies() {
	handleCookieConsent(getConsentSettings(false));
}

/**
 * Reads one boolean per category from the checkboxes.
 * A disabled checkbox is a required category (the template renders those `checked disabled`)
 * and keeps its rendered state whichever button was clicked.
 * @param optional {boolean|null} true accepts every optional category, false rejects them,
 * null keeps the state of each checkbox
 * @returns {Object} The consent settings, one boolean per category
 */
function getConsentSettings(optional = null) {
	const consent = {};
	document.querySelectorAll(".cookie-category").forEach((checkbox) => {
		const category = checkbox.id.replace(/^lcg-/, "");
		consent[category] = checkbox.disabled || optional === null ? checkbox.checked : optional;
	});
	return consent;
}

/**
 * Handles the user's cookie consent by sending an AJAX request to the server.
 * @param consent {Object} The user's cookie consent settings
 * @returns {void}
 * @description
 * This function handles the user's cookie consent by sending an AJAX request to the server.
 * The consent settings are stored as a JSON object with the category names as keys and their consent status as values.
 * The server returns the selection it accepted (unknown categories dropped, required categories
 * forced to true), and that selection is stored in a cookie with a specified prefix, for the
 * number of days configured in `cookies_consent.cookie_lifetime`.
 * If the server confirms the selection, the cookie is written, the banner is hidden and a success message
 * is displayed. Otherwise the banner stays open so the visitor can try again.
 */
function handleCookieConsent(consent) {
	const cookieBanner = document.getElementById("scify-cookies-consent");
	const cookieButton = document.getElementById("scify-cookie-consent-floating-button");
	const showFloatingButton =
		cookieBanner.dataset.showFloatingButton === "true" || cookieBanner.dataset.showFloatingButton === "1";
	const cookiePrefix = cookieBanner.dataset.cookiePrefix;
	const cookieLifetime = parseInt(cookieBanner.dataset.cookieLifetime, 10) || 365;
	const [csrfHeaderName, csrfToken] = csrfHeader(cookieBanner);
	consent["locale"] = cookieBanner.dataset.locale;

	const headers = { Accept: "application/json", "Content-Type": "application/json" };
	headers[csrfHeaderName] = csrfToken;

	fetch(cookieBanner.dataset.ajaxUrl, {
		method: "POST",
		headers: headers,
		body: JSON.stringify(consent),
	})
		.then((response) => response.json())
		.then((data) => {
			if (!data.success || !data.data) {
				throw new Error(data.message || "The server did not confirm the consent selection");
			}
			// The server drops unknown categories and forces the required ones to true,
			// so its copy of the selection is the one the browser stores and acts on.
			const selection = JSON.stringify(data.data);
			setCookie(cookiePrefix + "cookies_consent", selection, cookieLifetime);
			eraseRejectedCookies(data.data);
			setSliders(selection);
			showSuccessMessage(data.message);
			// if on cookies page, do not hide the banner
			if (!onCookiesPage()) {
				cookieBanner.style.display = "none";
				if (showFloatingButton) {
					cookieButton.style.display = "block";
				}
			}
			const dialog = cookieBanner.querySelector("dialog");
			if (dialog) {
				dialog.close();
			}
			if (onCookiesPage()) history.back();
		})
		.catch((error) => {
			// Leave the banner open so the visitor can try again.
			console.error("Error storing cookie consent", error);
		});
}

function showSuccessMessage(messageText) {
	const parent = document.getElementById("scify-cookies-consent-wrapper");
	if (parent) {
		const message = document.createElement("div");
		message.classList.add("cookie-success-message");
		message.innerText = messageText;
		parent.appendChild(message);
		setTimeout(() => {
			message.classList.add("show");
		}, 100);
		setTimeout(() => {
			message.classList.remove("show");
			setTimeout(() => {
				message.remove();
			}, 1000);
		}, 4000);
	}
}

function onCookiesPage() {
	const cookieBanner = document.getElementById("scify-cookies-consent");
	return cookieBanner.dataset.onCookiesPage === "true" || cookieBanner.dataset.onCookiesPage === "1";
}

/**
 * Builds the CSRF header for the save request.
 * The `XSRF-TOKEN` cookie is used first: Laravel refreshes it on every response, so it
 * stays current on pages that never reload. Without it, the banner root's `data-csrf-token`
 * attribute is used, then the `csrf-token` meta tag of components published before 5.1.
 * @param cookieBanner {Element} The banner root element
 * @returns {Array} The header name and its value
 */
function csrfHeader(cookieBanner) {
	const xsrfToken = getCookie("XSRF-TOKEN");
	if (xsrfToken) {
		return ["X-XSRF-TOKEN", xsrfToken];
	}
	const meta = document.querySelector('meta[name="csrf-token"]');
	const token = cookieBanner.dataset.csrfToken || (meta && meta.getAttribute("content")) || "";
	return ["X-CSRF-TOKEN", token];
}

function setCookie(name, value, days) {
	let expires = "";
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/";
}

function getCookie(name) {
	const nameEQ = name + "=";
	const ca = document.cookie.split(";");
	for (const c of ca) {
		const cookie = c.trim();
		if (cookie.startsWith(nameEQ)) {
			return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
		}
	}
	return null;
}

/**
 * Erases the cookies declared (by name) in every category the visitor rejected.
 * Only names the operator listed in the config are touched.
 * @param consent {Object} The consent settings, one boolean per category
 */
function eraseRejectedCookies(consent) {
	document.querySelectorAll(".cookie-category").forEach((checkbox) => {
		const category = checkbox.id.replace(/^lcg-/, "");
		if (consent[category] !== false) return;
		let names = [];
		try {
			names = JSON.parse(checkbox.dataset.cookieNames || "[]");
		} catch {
			names = [];
		}
		names.forEach(eraseCookie);
	});
}

/**
 * Expires a cookie on the current host and on each parent domain down to the
 * registrable one (browsers refuse the public suffix), since third-party cookies
 * such as Google Analytics live on the registrable domain.
 * @param name {string} The cookie name
 */
function eraseCookie(name) {
	const expired = name + "=; Max-Age=0; path=/";
	document.cookie = expired;
	const labels = window.location.hostname.split(".");
	for (let i = 0; i < labels.length - 1; i++) {
		document.cookie = expired + "; domain=" + labels.slice(i).join(".");
	}
}

window.toggleCookieBanner = function () {
	// if on cookies page, do nothing
	if (onCookiesPage()) return;

	const cookieBanner = document.getElementById("scify-cookies-consent");
	const cookieButton = document.getElementById("scify-cookie-consent-floating-button");
	const showFloatingButton =
		cookieBanner.dataset.showFloatingButton === "true" || cookieBanner.dataset.showFloatingButton === "1";
	const useShowModal = cookieBanner.dataset.useShowModal === "true" || cookieBanner.dataset.useShowModal === "1";
	const dialog = cookieBanner.querySelector("dialog");

	if (cookieBanner.style.display === "none" || cookieBanner.style.display === "") {
		cookieBanner.style.display = "block";
		if (dialog && useShowModal) {
			dialog.showModal();
		}
		if (showFloatingButton) {
			cookieButton.style.display = "none";
		}
	} else {
		cookieBanner.style.display = "none";
		if (dialog && useShowModal) {
			dialog.close();
		}
		if (showFloatingButton) {
			cookieButton.style.display = "block";
		}
	}
};

/**
 * Ensures that clicking any link with href="#consent-settings" always opens the cookie banner dialog.
 */
function initializeConsentSettingsLink() {
	document.querySelectorAll('a[href="#consent-settings"]').forEach((link) => {
		link.addEventListener("click", function (e) {
			e.preventDefault();
			window.location.hash = "#consent-settings"; // Optional: update hash for consistency
			if (typeof window.toggleCookieBanner === "function") {
				window.toggleCookieBanner();
			}
		});
	});
}
