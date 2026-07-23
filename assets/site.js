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


  /* Cards rise into view as they are scrolled to. The observer is the primary
     trigger because it re-measures whenever layout changes — a geometry sweep
     at DOMContentLoaded would see every card stacked near the top, before the
     images have any height, and fire them all at once. The sweep is kept only
     as the fallback for when the observer never delivers, on a backgrounded or
     prerendered tab, where a stranded card would sit invisible at opacity 0. */
  function revealCards() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));
    if (!cards.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    cards.forEach(function (c) { c.classList.add('pre-reveal'); });

    function settle(card) {
      card.classList.remove('revealing');
      card.style.animationDelay = '';
    }

    function show(card, i) {
      if (!card.classList.contains('pre-reveal')) return;
      card.classList.remove('pre-reveal');
      card.style.animationDelay = (i % 3) * 0.07 + 's';
      card.classList.add('revealing');
      card.addEventListener('animationend', function once() {
        card.removeEventListener('animationend', once);
        settle(card);
      });
      // If the animation never runs the fill would hold the card at opacity 0.
      setTimeout(function () { settle(card); }, 1400);
    }

    function sweep() {
      cards.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.88 && r.bottom > 0) show(c, i);
      });
    }

    var io = window.IntersectionObserver
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) show(e.target, cards.indexOf(e.target));
          });
        }, { threshold: 0.15 })
      : null;

    if (io) cards.forEach(function (c) { io.observe(c); });
    else sweep();

    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('load', sweep);   // images have settled the layout
    setTimeout(sweep, 1500);                  // in case load already fired
  }

  function init() {
    applyTheme(getTheme());
    applyLang(getLang());
    revealCards();

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
