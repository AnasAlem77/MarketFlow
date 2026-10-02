/* ============================================
   MARKET FLOW - LANGUAGE SYSTEM (i18n)
   Single source of truth for translations.

   - Loads assets/locales/{id,en}.json
   - Replaces every data-i18n* attribute
   - Handles the ID / EN switcher without reloading
   - Emits "marketflow:language-applied" so other
     scripts (main.js) can re-render dynamic content
   ============================================ */

(function () {
    'use strict';

    /* ------------------------------------------
       CONFIG
       ------------------------------------------ */

    const STORAGE_KEY = 'lang';
    const DEFAULT_LANG = 'id';
    const FALLBACK_LANG = 'en';
    const SUPPORTED = ['id', 'en'];

    /*
     * Resolve the locales folder relative to THIS script,
     * so it works from /, /admin/ or any sub-folder.
     * language.js lives in assets/js/ -> ../locales/
     */
    const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
    const LOCALES_BASE = SCRIPT_SRC
        ? new URL('../locales/', SCRIPT_SRC).href
        : 'assets/locales/';

    /*
     * Old data-i18n keys that still exist in some HTML.
     * The text itself always comes from the JSON files.
     */
    const KEY_ALIASES = {
        'about.why': 'about.why_title',
        'about.feature1_title': 'about.feature_1_title',
        'about.feature1_text': 'about.feature_1_text',
        'about.feature2_title': 'about.feature_2_title',
        'about.feature2_text': 'about.feature_2_text',
        'about.feature3_title': 'about.feature_3_title',
        'about.feature3_text': 'about.feature_3_text',
        'about.feature4_title': 'about.feature_4_title',
        'about.feature4_text': 'about.feature_4_text',
        'developer.developed_by': 'about.developer_text',
        'developer.text': 'about.developer_text',
        'developer.tooltip': 'about.developer_tooltip'
    };

    /* ------------------------------------------
       STATE
       ------------------------------------------ */

    let dictionaries = {};
    let loadPromise = null;
    let currentLang = readStoredLanguage();


    /* ------------------------------------------
       STORAGE
       ------------------------------------------ */

    function normalize(lang) {
        return SUPPORTED.includes(lang) ? lang : DEFAULT_LANG;
    }

    function readStoredLanguage() {
        try {
            return normalize(localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return DEFAULT_LANG;
        }
    }

    function storeLanguage(lang) {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (error) {
            console.warn('[Market Flow] Could not save language preference.', error);
        }
    }

    function getCurrentLanguage() {
        return currentLang;
    }


    /* ------------------------------------------
       LOAD JSON
       ------------------------------------------ */

    async function fetchDictionary(lang) {
        const url = `${LOCALES_BASE}${lang}.json`;

        const response = await fetch(url, { headers: { Accept: 'application/json' } });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} while loading ${url}`);
        }

        const data = await response.json();

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error(`Invalid translation file: ${url}`);
        }

        return data;
    }

    function loadTranslations() {
        if (loadPromise) {
            return loadPromise;
        }

        loadPromise = Promise.all(
            SUPPORTED.map(async (lang) => {
                try {
                    return [lang, await fetchDictionary(lang)];
                } catch (error) {
                    console.error(`[Market Flow] Failed to load ${lang}.json`, error);
                    return [lang, {}];
                }
            })
        ).then((entries) => {
            dictionaries = Object.fromEntries(entries);
            return dictionaries;
        });

        return loadPromise;
    }


    /* ------------------------------------------
       LOOKUP
       ------------------------------------------ */

    function lookup(dictionary, path) {
        let node = dictionary;

        for (const part of path.split('.')) {
            if (!node || typeof node !== 'object' || !(part in node)) {
                return null;
            }
            node = node[part];
        }

        return typeof node === 'string' ? node : null;
    }

    /**
     * Translate a key.
     * Order: current language -> fallback language -> `fallback` arg -> key.
     */
    function t(key, fallback) {
        if (!key) {
            return fallback || '';
        }

        const resolved = KEY_ALIASES[key] || key;

        const value =
            lookup(dictionaries[currentLang], resolved) ??
            lookup(dictionaries[FALLBACK_LANG], resolved);

        if (value !== null && value !== undefined) {
            return value;
        }

        return fallback !== undefined && fallback !== '' ? fallback : key;
    }

    function hasKey(key) {
        const resolved = KEY_ALIASES[key] || key;

        return (
            lookup(dictionaries[currentLang], resolved) !== null ||
            lookup(dictionaries[FALLBACK_LANG], resolved) !== null
        );
    }


    /* ------------------------------------------
       DOM UPDATES
       ------------------------------------------ */

    /*
     * Set text without destroying child elements
     * (e.g. an <a> that contains an <svg> and text).
     */
    function setText(element, value) {
        if (!element.children.length) {
            element.textContent = value;
            return;
        }

        const textNodes = Array.from(element.childNodes).filter(
            (node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== ''
        );

        if (textNodes.length) {
            textNodes[0].nodeValue = value;
            textNodes.slice(1).forEach((node) => node.remove());
        } else {
            element.appendChild(document.createTextNode(value));
        }
    }

    const ATTRIBUTE_BINDINGS = [
        ['data-i18n-placeholder', 'placeholder'],
        ['data-i18n-title', 'title'],
        ['data-i18n-aria-label', 'aria-label'],
        ['data-i18n-alt', 'alt']
    ];

    function applyTranslations(root) {
        const scope = root && root.querySelectorAll ? root : document;

        scope.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');

            if (key && hasKey(key)) {
                setText(element, t(key));
            }
        });

        ATTRIBUTE_BINDINGS.forEach(([dataAttribute, attribute]) => {
            scope.querySelectorAll(`[${dataAttribute}]`).forEach((element) => {
                const key = element.getAttribute(dataAttribute);

                if (key && hasKey(key)) {
                    element.setAttribute(attribute, t(key));
                }
            });
        });

        document.documentElement.lang = currentLang;

        updateLanguageButtons();

        window.dispatchEvent(
            new CustomEvent('marketflow:language-applied', {
                detail: { language: currentLang }
            })
        );
    }

    function updateLanguageButtons() {
        document.querySelectorAll('.lang-btn[data-lang]').forEach((button) => {
            const isActive = button.getAttribute('data-lang') === currentLang;

            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    }


    /* ------------------------------------------
       SWITCH LANGUAGE (no page reload)
       ------------------------------------------ */

    async function setLanguage(lang) {
        currentLang = normalize(lang);
        storeLanguage(currentLang);

        await loadTranslations();

        applyTranslations();
    }

    function bindLanguageButtons() {
        document.querySelectorAll('.lang-btn[data-lang]').forEach((button) => {
            if (button.dataset.langBound === 'true') {
                return;
            }

            button.dataset.langBound = 'true';

            /* Remove any legacy inline handler to avoid double firing. */
            button.removeAttribute('onclick');

            button.addEventListener('click', (event) => {
                event.preventDefault();
                setLanguage(button.getAttribute('data-lang'));
            });
        });
    }


    /* ------------------------------------------
       INIT
       ------------------------------------------ */

    async function init() {
        currentLang = readStoredLanguage();

        bindLanguageButtons();
        updateLanguageButtons();

        await loadTranslations();

        applyTranslations();
    }

    /* Keep several open tabs in sync. */
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.newValue && event.newValue !== currentLang) {
            setLanguage(event.newValue);
        }
    });

    const ready = new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener(
                'DOMContentLoaded',
                () => init().then(resolve),
                { once: true }
            );
        } else {
            init().then(resolve);
        }
    });


    /* ------------------------------------------
       PUBLIC API
       ------------------------------------------ */

    window.MarketFlowLanguage = {
        t,
        hasKey,
        ready,
        setLanguage,
        applyTranslations,
        getCurrentLanguage,
        updateLanguageButtons
    };

    /* Short global helpers used by main.js and inline code. */
    window.t = t;
    window.toggleLanguage = setLanguage;
})();
