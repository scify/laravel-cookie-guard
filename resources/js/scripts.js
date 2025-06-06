import '../styles/styles.scss';

document.addEventListener('DOMContentLoaded', function () {
    initializeAccordionButtons();
    initializeCookieBanner();
    initializeCookiePolicyLink();
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
    if (window.location.hash === '#consent-settings') {
        if (typeof window.toggleCookieBanner === 'function') {
            window.toggleCookieBanner();
        }
    }

    window.addEventListener('hashchange', function () {
        if (window.location.hash === '#consent-settings') {
            if (typeof window.toggleCookieBanner === 'function') {
                window.toggleCookieBanner();
            }
        }
    });
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
    document.querySelectorAll('.accordion-button').forEach(button => {
        button.removeEventListener('click', handleAccordionClick);
    });

    // Attach new event listeners
    document.querySelectorAll('.accordion-button').forEach(button => {
        button.addEventListener('click', handleAccordionClick);
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
    document.querySelectorAll('.accordion-collapse').forEach(collapse => {
        if (collapse !== target) {
            collapse.classList.remove('show');
            const relatedButton = document.querySelector(`[data-target="#${collapse.id}"]`);
            if (relatedButton) {
                relatedButton.classList.add('collapsed');
                if (window.cookies_consent_translations) relatedButton.textContent = window.cookies_consent_translations.read_more;
            }
        }
    });

    // Toggle the clicked accordion item
    if (target.classList.contains('show')) {
        // If the accordion is already open, close it
        target.classList.remove('show');
        button.classList.add('collapsed');
        if (window.cookies_consent_translations) button.textContent = window.cookies_consent_translations.read_more;
    } else {
        // If the accordion is closed, open it
        target.classList.add('show');
        button.classList.remove('collapsed');
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
    const cookieBanner = document.getElementById('scify-cookies-consent');
    const cookieButton = document.getElementById('scify-cookie-consent-floating-button');
    const showFloatingButton = cookieBanner.dataset.showFloatingButton === 'true' || cookieBanner.dataset.showFloatingButton === '1';
    const hideFloatingButtonOnMobile = cookieBanner.dataset.hideFloatingButtonOnMobile === 'true' || cookieBanner.dataset.hideFloatingButtonOnMobile === '1';
    const cookiePrefix = cookieBanner.dataset.cookiePrefix;
    let cookieConsent = getCookie(cookiePrefix + 'cookies_consent');

    initialiseBanner(cookieBanner, cookieButton, showFloatingButton, hideFloatingButtonOnMobile, cookieConsent);
    setSliders(cookieConsent);

    addEventListeners({
        'customise-cookies': handleCustomiseCookies,
        'accept-all-cookies': handleAcceptAllCookies,
        'accept-selected-cookies': handleAcceptSelectedCookies,
        'reject-optional-cookies': handleRejectOptionalCookies,
        'close-cookie-policy-page': handleAcceptSelectedCookies,
    });
}

function addEventListeners(buttonHandlers) {
    for (const [buttonId, handler] of Object.entries(buttonHandlers)) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', handler);
        }
    }
}

function initialiseBanner(cookieBanner, cookieButton, showFloatingButton, hideFloatingButtonOnMobile, cookieConsent) {
    if (onCookiesPage()) {
        cookieBanner.style.display = 'block';
    } else {
        toggleBannerDisplay(cookieBanner, cookieButton, showFloatingButton, hideFloatingButtonOnMobile, cookieConsent);
    }
}

function toggleBannerDisplay(cookieBanner, cookieButton, showFloatingButton, hideFloatingButtonOnMobile, cookieConsent) {
    const useShowModal = cookieBanner.dataset.useShowModal === 'true' || cookieBanner.dataset.useShowModal === '1';
    if (cookieConsent) {
        cookieBanner.style.display = 'none';
        if (showFloatingButton && cookieButton) {
            // Hide the floating button on mobile if the configuration allows it
            cookieButton.style.display = hideFloatingButtonOnMobile && window.innerWidth < 768 ? 'none' : 'block';
        }
    } else {
        cookieBanner.style.display = 'block';
        const dialog = cookieBanner.querySelector('dialog');
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
        const consentSettings = JSON.parse(cookieConsent);
        for (const category in consentSettings) {
            const categoryCheckbox = document.getElementById(category);
            if (categoryCheckbox) {
                categoryCheckbox.checked = consentSettings[category];
            }
        }
    }
}

function handleCustomiseCookies() {
    const cookieCategoriesContainer = document.getElementById('cookie-categories-container');
    // remove the "display-none" class to show the cookie categories
    cookieCategoriesContainer.classList.remove('display-none');

    // hide the parent with class "button-col" of the "customise-cookies" button
    document.getElementById('customise-cookies').closest('.button-col').classList.add('display-none');
    // show the "accept-selected-cookies" button
    document.getElementById('accept-selected-cookies').closest('.button-col').classList.remove('display-none');
}

function handleAcceptAllCookies() {
    handleCookieConsent(getConsentSettings(true));
}

function handleAcceptSelectedCookies() {
    handleCookieConsent(getConsentSettings());
}

function handleRejectOptionalCookies() {
    handleCookieConsent(getConsentSettings(false, 'strictly_necessary'));
}

function getConsentSettings(acceptAll = false, requiredCategory = null) {
    const consent = {};
    document.querySelectorAll('.cookie-category').forEach(checkbox => {
        consent[checkbox.id] = acceptAll || checkbox.id === requiredCategory || checkbox.checked;
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
 * The consent settings are then stored in a cookie with a specified prefix.
 * If the consent is successfully stored, the cookie banner is hidden and a success message is displayed
 * to inform the user about the successful storage of their consent.
 */
function handleCookieConsent(consent) {
    const cookieBanner = document.getElementById('scify-cookies-consent');
    const cookieButton = document.getElementById('scify-cookie-consent-floating-button');
    const showFloatingButton = cookieBanner.dataset.showFloatingButton === 'true' || cookieBanner.dataset.showFloatingButton === '1';
    const cookiePrefix = cookieBanner.dataset.cookiePrefix;
    consent['locale'] = cookieBanner.dataset.locale;

    // if on cookies page, do not hide the banner
    if (!onCookiesPage()) {
        cookieBanner.style.display = 'none';
        if (showFloatingButton) {
            cookieButton.style.display = 'block';
        }
    }

    fetch(cookieBanner.dataset.ajaxUrl, {
        method: 'POST', headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }, body: JSON.stringify(consent)
    }).then(response => response.json())
        .then(data => {
            if (data.success) {
                setCookie(cookiePrefix + 'cookies_consent', JSON.stringify(consent), 30);
                setSliders(JSON.stringify(consent));
                showSuccessMessage(data.message);
                const dialog = cookieBanner.querySelector('dialog');
                if (dialog) {
                    dialog.close();
                }
                if(onCookiesPage())
                    history.back();
            }
        })
        .catch(() => {
            console.error('Error storing cookie consent');
            const dialog = cookieBanner.querySelector('dialog');
            if (dialog) {
                dialog.close();
            }
        });
}

function showSuccessMessage(messageText) {
    const parent = document.getElementById('scify-cookies-consent-wrapper');
    if (parent) {
        const message = document.createElement('div');
        message.classList.add('cookie-success-message');
        message.innerText = messageText;
        parent.appendChild(message);
        setTimeout(() => {
            message.classList.add('show');
        }, 100);
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                message.remove();
            }, 1000);
        }, 4000);
    }
}

function initializeCookiePolicyLink() {
    const cookiePolicyLink = document.getElementById('cookie-policy-link');
    if (cookiePolicyLink) {
        cookiePolicyLink.addEventListener('click', function () {
            eraseCookie('cookieConsent');
        });
    }
}

function onCookiesPage() {
    const cookieBanner = document.getElementById('scify-cookies-consent');
    return cookieBanner.dataset.onCookiesPage === 'true' || cookieBanner.dataset.onCookiesPage === '1';
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (const c of ca) {
        let cookie = c.trim();
        if (cookie.startsWith(nameEQ)) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

window.toggleCookieBanner = function () {
    // if on cookies page, do nothing
    if (onCookiesPage()) return;

    const cookieBanner = document.getElementById('scify-cookies-consent');
    const cookieButton = document.getElementById('scify-cookie-consent-floating-button');
    const showFloatingButton = cookieBanner.dataset.showFloatingButton === 'true' || cookieBanner.dataset.showFloatingButton === '1';
    const useShowModal = cookieBanner.dataset.useShowModal === 'true' || cookieBanner.dataset.useShowModal === '1';
    const dialog = cookieBanner.querySelector('dialog');

    if (cookieBanner.style.display === 'none' || cookieBanner.style.display === '') {
        cookieBanner.style.display = 'block';
        if (dialog && useShowModal) {
            dialog.showModal();
        }
        if (showFloatingButton) {
            cookieButton.style.display = 'none';
        }
    } else {
        cookieBanner.style.display = 'none';
        if (dialog && useShowModal) {
            dialog.close();
        }
        if (showFloatingButton) {
            cookieButton.style.display = 'block';
        }
    }
};

/**
 * Ensures that clicking any link with href="#consent-settings" always opens the cookie banner dialog.
 */
function initializeConsentSettingsLink() {
    document.querySelectorAll('a[href="#consent-settings"]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.hash = '#consent-settings'; // Optional: update hash for consistency
            if (typeof window.toggleCookieBanner === 'function') {
                window.toggleCookieBanner();
            }
        });
    });
}
