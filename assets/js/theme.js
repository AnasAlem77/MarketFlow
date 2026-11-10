/* Market Flow appearance controller — shared by public and admin pages. */
(function () {
    'use strict';

    const KEY = 'marketflow-theme';
    const modes = ['system', 'light', 'dark'];
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const icons = {
        system: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
        light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
        dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 15.79A8.5 8.5 0 0 1 8.21 3.4 8.5 8.5 0 1 0 20.6 15.79Z"/></svg>'
    };

    function preference() {
        try {
            const value = localStorage.getItem(KEY);
            return modes.includes(value) ? value : 'system';
        } catch (_) { return 'system'; }
    }

    function effective(mode = preference()) {
        return mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
    }

    function apply(mode = preference()) {
        document.documentElement.dataset.theme = effective(mode);
        document.documentElement.dataset.themePreference = mode;
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', effective(mode) === 'dark' ? '#090909' : '#f0f1f3');
        updateControls(mode);
    }

    function updateControls(mode) {
        document.querySelectorAll('.theme-switcher').forEach((switcher) => {
            const trigger = switcher.querySelector('.theme-trigger');
            if (trigger) {
                trigger.innerHTML = icons[mode];
                trigger.setAttribute('aria-label', `${label('appearance')} (${label(mode)})`);
            }
            switcher.querySelectorAll('[data-theme-mode]').forEach((option) => {
                const selected = option.dataset.themeMode === mode;
                option.classList.toggle('selected', selected);
                option.setAttribute('aria-checked', String(selected));
            });
        });
    }

    function label(key) {
        const lang = document.documentElement.lang === 'en' ? 'en' : 'id';
        return ({ id: { appearance: 'Tampilan', system: 'Otomatis / Sistem', light: 'Terang', dark: 'Gelap' }, en: { appearance: 'Appearance', system: 'System', light: 'Light', dark: 'Dark' } })[lang][key];
    }

    function createSwitcher() {
        const wrapper = document.createElement('div');
        wrapper.className = 'theme-switcher';
        wrapper.innerHTML = `
            <button type="button" class="theme-trigger" aria-haspopup="menu" aria-expanded="false"></button>
            <div class="theme-menu" role="menu" aria-label="${label('appearance')}">
                ${modes.map((mode) => `<button type="button" role="menuitemradio" data-theme-mode="${mode}" aria-checked="false">${icons[mode]}<span data-i18n="theme.${mode}">${label(mode)}</span><span class="theme-check" aria-hidden="true">✓</span></button>`).join('')}
            </div>`;
        const trigger = wrapper.querySelector('.theme-trigger');
        trigger.addEventListener('click', () => {
            const opened = wrapper.classList.toggle('open');
            trigger.setAttribute('aria-expanded', String(opened));
        });
        wrapper.querySelectorAll('[data-theme-mode]').forEach((option) => option.addEventListener('click', () => {
            const mode = option.dataset.themeMode;
            try { localStorage.setItem(KEY, mode); } catch (_) { /* storage unavailable */ }
            apply(mode);
            wrapper.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        }));
        return wrapper;
    }

    function mount() {
        document.querySelectorAll('.language-toggle').forEach((languageToggle) => {
            if (!languageToggle.parentElement.querySelector('.theme-switcher')) languageToggle.insertAdjacentElement('afterend', createSwitcher());
        });
        apply();
    }

    document.addEventListener('click', (event) => document.querySelectorAll('.theme-switcher.open').forEach((switcher) => {
        if (!switcher.contains(event.target)) {
            switcher.classList.remove('open');
            switcher.querySelector('.theme-trigger').setAttribute('aria-expanded', 'false');
        }
    }));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') document.querySelectorAll('.theme-switcher.open').forEach((switcher) => switcher.classList.remove('open'));
    });
    media.addEventListener('change', () => { if (preference() === 'system') apply('system'); });
    document.addEventListener('marketflow:language-applied', () => { document.querySelectorAll('.theme-switcher').forEach((node) => node.remove()); mount(); });
    document.addEventListener('DOMContentLoaded', mount);
    apply();
    window.MarketFlowTheme = { apply, preference, effective };
}());
