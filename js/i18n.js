/**
 * Void Ray - Internationalization (i18n) System
 * Supports Turkish and English languages
 * 
 * Language files are stored separately in ./i18n/ folder:
 * - tr.js: Turkish translations
 * - en.js: English translations
 */

import { tr } from './i18n/tr.js';
import { en } from './i18n/en.js';

// Current language (default: Turkish)
export let currentLanguage = 'tr';

// Language translations - imported from separate files
export const translations = { tr, en };

/**
 * Gets translated text for a given key path
 * @param {string} keyPath - Dot notation path (e.g., 'menu.start')
 * @param {string} lang - Optional language override
 * @returns {string} Translated text
 */
export function t(keyPath, lang = currentLanguage) {
    const keys = keyPath.split('.');
    let result = translations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            // Fallback to Turkish if key not found
            let fallback = translations['tr'];
            for (const k of keys) {
                if (fallback && fallback[k] !== undefined) {
                    fallback = fallback[k];
                } else {
                    return keyPath; // Return key path if not found
                }
            }
            return fallback;
        }
    }

    return result;
}

/**
 * Sets the current language
 * @param {string} lang - Language code ('tr' or 'en')
 */
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;

        // Save to localStorage
        localStorage.setItem('gameLanguage', lang);

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Trigger language change event
        if (window.eventBus) {
            window.eventBus.emit('language:changed', { language: lang });
        }

        // Update all translatable elements
        updateAllTranslations();

        return true;
    }
    return false;
}

/**
 * Gets the current language
 * @returns {string} Current language code
 */
export function getLanguage() {
    return currentLanguage;
}

/**
 * Initializes the i18n system
 */
export function initI18n() {
    // Load saved language preference
    const savedLang = localStorage.getItem('gameLanguage');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
        document.documentElement.lang = savedLang;
    }

    console.log(`[i18n] Initialized with language: ${currentLanguage}`);
}

/**
 * Updates all elements with data-i18n attribute
 */
export function updateAllTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation !== key) {
            el.textContent = translation;
        }
    });

    // Update elements with data-i18n-title attribute (for titles/tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translation = t(key);
        if (translation !== key) {
            el.title = translation;
        }
    });

    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        if (translation !== key) {
            el.placeholder = translation;
        }
    });
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.i18n = {
        t,
        setLanguage,
        getLanguage,
        initI18n,
        updateAllTranslations,
        translations,
        get currentLanguage() { return currentLanguage; }
    };
    window.t = t;
}
