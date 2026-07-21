/* ==========================================================================
   Guillaume Goder portfolio — theme (dark/light) + language (EN/FR) toggle
   ========================================================================== */
(function () {
  'use strict';

  function getTheme() { return localStorage.getItem('theme') || 'dark'; }
  function getLang() { return localStorage.getItem('lang') || 'en'; }

  function applyTheme(theme) {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
    document.querySelectorAll('.theme-toggle-btn').forEach(function (b) {
      b.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    });
  }

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('lang', lang);

    var key = lang === 'fr' ? 'fr' : 'en';

    document.querySelectorAll('.i18n').forEach(function (el) {
      var val = el.getAttribute('data-' + key);
      if (val !== null) el.textContent = val;
    });

    document.querySelectorAll('img[data-alt-en]').forEach(function (el) {
      var val = el.getAttribute('data-alt-' + key);
      if (val !== null) el.setAttribute('alt', val);
    });

    var titleEl = document.querySelector('title[data-en]');
    if (titleEl) {
      var tv = titleEl.getAttribute('data-' + key);
      if (tv) document.title = tv;
    }

    var descEl = document.querySelector('meta[name="description"][data-en]');
    if (descEl) {
      var dv = descEl.getAttribute('data-' + key);
      if (dv) descEl.setAttribute('content', dv);
    }

    document.querySelectorAll('.lang-toggle-btn').forEach(function (b) {
      b.textContent = lang === 'fr' ? 'EN' : 'FR';
      b.setAttribute('aria-label', lang === 'fr' ? 'Switch to English' : 'Passer en français');
    });
  }

  function init() {
    applyTheme(getTheme());
    applyLang(getLang());

    document.querySelectorAll('.theme-toggle-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        applyTheme(getTheme() === 'light' ? 'dark' : 'light');
      });
    });
    document.querySelectorAll('.lang-toggle-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        applyLang(getLang() === 'fr' ? 'en' : 'fr');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
