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

  /* A poster alone does not read as playable, so overlay a central play button
     that pulses when the video scrolls into view. Progressive enhancement: the
     button is injected here, and the native controls stay on the <video> as the
     no-JS fallback until this runs and takes over. Works for any .video-embed. */
  function setupVideoEmbeds() {
    var PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L8 19 L20 12 Z"/></svg>';
    Array.prototype.forEach.call(document.querySelectorAll('.video-embed'), function (embed) {
      var video = embed.querySelector('video');
      if (!video || embed.querySelector('.video-play-btn')) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'video-play-btn';
      btn.setAttribute('aria-label', getLang() === 'fr' ? 'Lire la vidéo' : 'Play video');
      btn.innerHTML = PLAY_SVG;
      embed.appendChild(btn);

      video.removeAttribute('controls');           // our button is the only control until play

      function start() {
        embed.classList.add('playing');
        video.setAttribute('controls', '');
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      }
      btn.addEventListener('click', start);
      video.addEventListener('play', function () { embed.classList.add('playing'); });

      // Pulse only while the video is on screen — start it as it scrolls in.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { embed.classList.toggle('in-view', e.isIntersecting); });
        }, { threshold: 0.4 }).observe(embed);
      } else {
        embed.classList.add('in-view');
      }
    });
  }

  /* Figma embed: façade → load on demand → lock/unlock. The iframe is never in
     the page until "Load canvas" is tapped, so initial load stays light and the
     infinite canvas cannot trap touch scroll. Once loaded it sits behind an
     inert shield (page scrolls past it); an explicit Unlock hands touch to
     Figma, and Lock hands it back. */
  function setupFigmaEmbeds() {
    var MOVE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v17M3.5 12h17"/><path d="M12 3.5 9.6 6M12 3.5 14.4 6M12 20.5 9.6 18M12 20.5 14.4 18M3.5 12 6 9.6M3.5 12 6 14.4M20.5 12 18 9.6M20.5 12 18 14.4"/></svg>';
    var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

    Array.prototype.forEach.call(document.querySelectorAll('.figma-embed'), function (embed) {
      var src = embed.getAttribute('data-figma-src');
      var cta = embed.querySelector('.figma-cta');
      var loadBtn = embed.querySelector('.figma-load-btn');
      if (!src || !cta) return;
      var loaded = false;

      function load() {
        if (loaded) return;
        loaded = true;
        var fr = getLang() === 'fr';

        var iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = 'Outpost Red UI Project — Figma file';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');
        embed.insertBefore(iframe, embed.firstChild);

        var shield = document.createElement('button');
        shield.type = 'button';
        shield.className = 'figma-shield';
        shield.setAttribute('aria-label', fr ? 'Déverrouiller le canevas' : 'Unlock the canvas');
        shield.innerHTML = '<span class="figma-shield-hint">' + MOVE +
          '<span class="i18n" data-en="Unlock to pan &amp; zoom" data-fr="Déverrouiller pour explorer">' +
          (fr ? 'Déverrouiller pour explorer' : 'Unlock to pan & zoom') + '</span></span>';
        embed.appendChild(shield);

        var pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'figma-lock-pill';
        pill.innerHTML = LOCK +
          '<span class="i18n" data-en="Lock" data-fr="Verrouiller">' + (fr ? 'Verrouiller' : 'Lock') + '</span>';
        embed.appendChild(pill);

        shield.addEventListener('click', function () { embed.classList.add('unlocked'); });
        pill.addEventListener('click', function () { embed.classList.remove('unlocked'); });

        embed.classList.add('loaded');
      }

      cta.addEventListener('click', load);
      if (loadBtn) loadBtn.addEventListener('click', function (e) { e.stopPropagation(); load(); });
    });
  }

  /* Swap the static nav logo for the animated dodo (head tilt, wink, pen pivot,
     tail fan). Injected here so it lives in one place across every page; the
     static <img> stays as the no-JS fallback until this runs. Theme follows the
     html.light class via CSS. */
  function setupDodoLogo() {
    Array.prototype.forEach.call(document.querySelectorAll('nav a[href="index.html"] img'), function (img) {
      if (!img.parentNode) return;
      var wrap = document.createElement('span');
      wrap.className = 'dodo-logo shrink-0';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML =
        '<span class="stg">' +
          '<span class="dl base"></span>' +
          '<span class="dl tail"></span>' +
          '<span class="dl pen"></span>' +
          '<span class="dl head"><span class="lid"></span></span>' +
        '</span>';
      img.parentNode.replaceChild(wrap, img);
    });
  }

  function setupCustomDatePicker() {
    document.querySelectorAll('input[type="date"]').forEach(function (input) {
      input.setAttribute('type', 'text');
      input.setAttribute('readonly', 'true');
      input.setAttribute('placeholder', getLang() === 'fr' ? 'Sélectionner une date...' : 'Select target date...');

      var container = document.createElement('div');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.style.width = '100%';

      input.parentNode.insertBefore(container, input);
      container.appendChild(input);

      var popover = null;
      var viewDate = new Date();

      function renderCalendar() {
        if (!popover) {
          popover = document.createElement('div');
          popover.className = 'custom-date-popover';
          container.appendChild(popover);
        }

        var year = viewDate.getFullYear();
        var month = viewDate.getMonth();
        var isFr = getLang() === 'fr';

        var monthNames = isFr ?
          ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"] :
          ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        var daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

        var firstDayOfMonth = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var daysInPrevMonth = new Date(year, month, 0).getDate();

        var html = '<div class="cal-header">' +
          '<span class="cal-title">' + monthNames[month] + ', ' + year + '</span>' +
          '<div class="cal-nav">' +
          '<button type="button" class="cal-btn prev-m">‹</button>' +
          '<button type="button" class="cal-btn next-m">›</button>' +
          '</div></div>';

        html += '<div class="cal-weekdays">';
        daysOfWeek.forEach(function (w) { html += '<span>' + w + '</span>'; });
        html += '</div>';

        html += '<div class="cal-days">';
        for (var p = firstDayOfMonth - 1; p >= 0; p--) {
          html += '<span class="day-off">' + (daysInPrevMonth - p) + '</span>';
        }

        var valParts = input.value ? input.value.split('-') : [];
        var selY = valParts.length === 3 ? parseInt(valParts[0], 10) : -1;
        var selM = valParts.length === 3 ? parseInt(valParts[1], 10) - 1 : -1;
        var selD = valParts.length === 3 ? parseInt(valParts[2], 10) : -1;

        var today = new Date();

        for (var d = 1; d <= daysInMonth; d++) {
          var isSel = (selY === year && selM === month && selD === d);
          var isTod = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d);
          var cls = 'cal-day' + (isSel ? ' is-selected' : '') + (isTod ? ' is-today' : '');
          html += '<button type="button" class="' + cls + '" data-day="' + d + '">' + d + '</button>';
        }

        var totalCells = firstDayOfMonth + daysInMonth;
        var rem = (42 - totalCells) % 7;
        for (var n = 1; n <= rem; n++) {
          html += '<span class="day-off">' + n + '</span>';
        }
        html += '</div>';

        html += '<div class="cal-footer">' +
          '<button type="button" class="cal-action cal-clear">' + (isFr ? 'Effacer' : 'Clear') + '</button>' +
          '<button type="button" class="cal-action cal-today">' + (isFr ? 'Aujourd\'hui' : 'Today') + '</button>' +
          '</div>';

        popover.innerHTML = html;

        popover.querySelector('.prev-m').onclick = function (e) {
          e.stopPropagation(); viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar();
        };
        popover.querySelector('.next-m').onclick = function (e) {
          e.stopPropagation(); viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar();
        };
        popover.querySelector('.cal-clear').onclick = function (e) {
          e.stopPropagation(); input.value = ''; closePopover();
        };
        popover.querySelector('.cal-today').onclick = function (e) {
          e.stopPropagation();
          var now = new Date();
          var mm = String(now.getMonth() + 1).padStart(2, '0');
          var dd = String(now.getDate()).padStart(2, '0');
          input.value = now.getFullYear() + '-' + mm + '-' + dd;
          closePopover();
        };

        popover.querySelectorAll('.cal-day').forEach(function (btn) {
          btn.onclick = function (e) {
            e.stopPropagation();
            var dayNum = btn.getAttribute('data-day');
            var mm = String(month + 1).padStart(2, '0');
            var dd = String(dayNum).padStart(2, '0');
            input.value = year + '-' + mm + '-' + dd;
            closePopover();
          };
        });
      }

      function closePopover() {
        if (popover && popover.parentNode) {
          popover.parentNode.removeChild(popover);
          popover = null;
        }
      }

      input.onclick = function (e) {
        e.stopPropagation();
        if (popover) { closePopover(); } else { renderCalendar(); }
      };

      document.addEventListener('click', function (e) {
        if (popover && !container.contains(e.target)) { closePopover(); }
      });
    });
  }

  function init() {
    applyTheme(getTheme());
    applyLang(getLang());
    revealCards();
    pressFeedback();
    setupVideoEmbeds();
    setupFigmaEmbeds();
    setupDodoLogo();
    setupCustomDatePicker();

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
