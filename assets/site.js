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


  /* Cards rise into view as they are scrolled to. Cards fix their height with
     aspect-ratio, not the (lazy) image, so the layout is stable once the grid
     applies — a rAF sweep after the first paint reveals whatever is already on
     screen without waiting on the observer's first async callback, which was
     leaving visible cards blank for a beat on a tablet. The observer and the
     scroll listener then handle whatever starts below the fold; the load and
     timeout sweeps are the last resort if the observer never delivers. */
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
      // Any card with a pixel on screen counts — a card near the bottom edge is
      // visible and must not read as empty. A tighter margin left a band of
      // on-screen-but-unrevealed cards, most visible on a tablet's tall viewport.
      cards.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) show(c, i);
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

    // Reveal in-view cards on the first frame after layout, not on the
    // observer's first callback. rAF (not DOMContentLoaded) so the grid has
    // applied and cards are not still stacked full-width near the top.
    if (window.requestAnimationFrame) window.requestAnimationFrame(sweep);
    else sweep();

    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('load', sweep);   // belt-and-braces once everything settles
    setTimeout(sweep, 1500);                  // final fallback if the observer stays silent
  }

  /* A touchstart is the only reliable signal that a finger is on the card:
     media queries misreport on some Android browsers, and iOS restricts
     :active. Releasing on touchmove matters — otherwise a card stays squeezed
     while the page is scrolled with a finger resting on it. */
  function pressFeedback() {
    Array.prototype.forEach.call(document.querySelectorAll('.project-card'), function (card) {
      function press()   { card.classList.add('is-pressed'); }
      function release() { card.classList.remove('is-pressed'); }
      card.addEventListener('touchstart',  press,   { passive: true });
      card.addEventListener('touchmove',   release, { passive: true });
      card.addEventListener('touchend',    release);
      card.addEventListener('touchcancel', release);
    });
  }

  function init() {
    applyTheme(getTheme());
    applyLang(getLang());
    revealCards();
    pressFeedback();

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
