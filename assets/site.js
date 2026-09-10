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

  function setupMobileMenu() {
    var btns = document.querySelectorAll('.game-more-menu-btn, #hamburger-btn, button[aria-label="Menu"]');
    var menu = document.getElementById('mobile-menu');
    if (!menu) return;

    btns.forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        menu.classList.toggle('hidden');
      };
    });

    document.addEventListener('click', function (e) {
      if (menu && !menu.classList.contains('hidden')) {
        var isClickInside = menu.contains(e.target);
        var isClickBtn = Array.from(btns).some(function (b) { return b.contains(e.target); });
        if (!isClickInside && !isClickBtn) {
          menu.classList.add('hidden');
        }
      }
    });

    menu.querySelectorAll('a').forEach(function (a) {
      a.onclick = function () {
        menu.classList.add('hidden');
      };
    });
  }

  /* ==========================================================================
     Modern Fullscreen Gallery Lightbox with Zoom, Pan, Animations & Navigation
     ========================================================================== */
  function setupGalleryLightbox() {
    // Only run lightbox on project case studies, art galleries, and resume pages.
    // Explicitly bypass index.html and pages with project navigation cards.
    var path = (window.location.pathname || '').toLowerCase();
    var isHome = path.endsWith('index.html') ||
                 path === '' ||
                 path === '/' ||
                 path.endsWith('/') ||
                 document.querySelector('.project-card') !== null;
    if (isHome) return;

    var galleryItems = [];
    var currentIndex = 0;
    var currentScale = 1;
    var currentPanX = 0;
    var currentPanY = 0;
    var isDragging = false;
    var isPointerDown = false;
    var startX = 0;
    var startY = 0;
    var startPanX = 0;
    var startPanY = 0;
    var moveDistance = 0;
    var touchStartX = 0;
    var touchStartY = 0;
    var overlay = null;
    var imgEl = null;
    var imgContainer = null;
    var imgWrap = null;
    var counterEl = null;
    var titleEl = null;
    var zoomPill = null;
    var prevBtn = null;
    var nextBtn = null;
    var isAnimating = false;

    var ZOOM_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
    var ZOOM_IN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
    var ZOOM_OUT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
    var CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    var FULLSCREEN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
    var PREV_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    var NEXT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    function buildLightboxDOM() {
      if (document.getElementById('gallery-lightbox')) {
        overlay = document.getElementById('gallery-lightbox');
        imgEl = overlay.querySelector('.glb-image');
        imgContainer = overlay.querySelector('.glb-image-container');
        imgWrap = overlay.querySelector('.glb-image-wrap');
        counterEl = overlay.querySelector('.glb-counter');
        titleEl = overlay.querySelector('.glb-title');
        zoomPill = overlay.querySelector('.glb-zoom-pill');
        prevBtn = overlay.querySelector('.glb-nav-prev');
        nextBtn = overlay.querySelector('.glb-nav-next');
        return;
      }

      overlay = document.createElement('div');
      overlay.id = 'gallery-lightbox';
      overlay.className = 'glb-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', getLang() === 'fr' ? 'Visualiseur d\'images' : 'Image viewer');
      overlay.style.display = 'none';

      var fr = getLang() === 'fr';

      overlay.innerHTML =
        '<div class="glb-header">' +
          '<div class="glb-header-left">' +
            '<span class="glb-counter">01 / 01</span>' +
            '<span class="glb-title"></span>' +
          '</div>' +
          '<div class="glb-header-actions">' +
            '<button type="button" class="glb-btn glb-btn-zoom-out" aria-label="' + (fr ? 'Zoom arrière' : 'Zoom out') + '">' + ZOOM_OUT_SVG + '</button>' +
            '<button type="button" class="glb-zoom-pill" aria-label="' + (fr ? 'Réinitialiser le zoom' : 'Reset zoom') + '">100%</button>' +
            '<button type="button" class="glb-btn glb-btn-zoom-in" aria-label="' + (fr ? 'Zoom avant' : 'Zoom in') + '">' + ZOOM_IN_SVG + '</button>' +
            '<button type="button" class="glb-btn glb-btn-fullscreen" aria-label="' + (fr ? 'Plein écran' : 'Toggle fullscreen') + '">' + FULLSCREEN_SVG + '</button>' +
            '<button type="button" class="glb-btn glb-btn-close" aria-label="' + (fr ? 'Fermer (Échap)' : 'Close (Esc)') + '">' + CLOSE_SVG + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="glb-stage">' +
          '<button type="button" class="glb-nav-btn glb-nav-prev" aria-label="' + (fr ? 'Image précédente' : 'Previous image') + '">' + PREV_SVG + '</button>' +
          '<div class="glb-image-wrap">' +
            '<div class="glb-image-container">' +
              '<img class="glb-image" src="" alt="" draggable="false" />' +
            '</div>' +
          '</div>' +
          '<button type="button" class="glb-nav-btn glb-nav-next" aria-label="' + (fr ? 'Image suivante' : 'Next image') + '">' + NEXT_SVG + '</button>' +
        '</div>' +
        '<div class="glb-footer">' +
          '<div class="glb-hint">' +
            '<span><kbd>←</kbd> <kbd>→</kbd> ' + (fr ? 'Naviguer' : 'Navigate') + '</span>' +
            '<span><kbd>' + (fr ? 'Clic' : 'Click') + '</kbd> / <kbd>' + (fr ? 'Molette' : 'Scroll') + '</kbd> ' + (fr ? 'Zoomer' : 'Zoom') + '</span>' +
            '<span><kbd>' + (fr ? 'Glisser' : 'Drag') + '</kbd> ' + (fr ? 'Déplacer' : 'Pan') + '</span>' +
            '<span><kbd>Échap</kbd> ' + (fr ? 'Fermer' : 'Close') + '</span>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      imgEl = overlay.querySelector('.glb-image');
      imgContainer = overlay.querySelector('.glb-image-container');
      imgWrap = overlay.querySelector('.glb-image-wrap');
      counterEl = overlay.querySelector('.glb-counter');
      titleEl = overlay.querySelector('.glb-title');
      zoomPill = overlay.querySelector('.glb-zoom-pill');
      prevBtn = overlay.querySelector('.glb-nav-prev');
      nextBtn = overlay.querySelector('.glb-nav-next');

      // Header actions
      overlay.querySelector('.glb-btn-zoom-in').addEventListener('click', function (e) {
        e.stopPropagation(); setZoom(currentScale + 0.5);
      });
      overlay.querySelector('.glb-btn-zoom-out').addEventListener('click', function (e) {
        e.stopPropagation(); setZoom(currentScale - 0.5);
      });
      zoomPill.addEventListener('click', function (e) {
        e.stopPropagation();
        setZoom(currentScale > 1.05 ? 1 : 2.2);
      });
      overlay.querySelector('.glb-btn-fullscreen').addEventListener('click', function (e) {
        e.stopPropagation();
        if (!document.fullscreenElement) {
          if (overlay.requestFullscreen) overlay.requestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      });
      overlay.querySelector('.glb-btn-close').addEventListener('click', function (e) {
        e.stopPropagation(); closeLightbox();
      });

      // Navigation
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation(); showPrev();
      });
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation(); showNext();
      });

      // Backdrop dismiss
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.classList.contains('glb-stage')) {
          closeLightbox();
        }
      });

      // Pointer / Drag & Pan
      imgWrap.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      // Mouse Wheel Zoom
      imgWrap.addEventListener('wheel', onWheel, { passive: false });

      // Double-click / Double-tap zoom
      imgWrap.addEventListener('dblclick', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleZoom(e.clientX, e.clientY);
      });
    }

    function updateTransform(animate) {
      if (!imgContainer) return;
      if (animate === false) {
        imgContainer.style.transition = 'none';
      } else {
        imgContainer.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      }
      imgContainer.style.transform = 'scale(' + currentScale + ') translate(' + currentPanX + 'px, ' + currentPanY + 'px)';
      if (zoomPill) {
        zoomPill.textContent = Math.round(currentScale * 100) + '%';
      }
      if (imgWrap) {
        imgWrap.classList.toggle('is-zoomed', currentScale > 1.05);
      }
    }

    function setZoom(newScale, clientX, clientY) {
      newScale = Math.max(1, Math.min(4, newScale));
      if (newScale <= 1.02) {
        currentScale = 1;
        currentPanX = 0;
        currentPanY = 0;
      } else {
        if (clientX !== undefined && clientY !== undefined && imgWrap) {
          var rect = imgWrap.getBoundingClientRect();
          var offsetX = clientX - (rect.left + rect.width / 2);
          var offsetY = clientY - (rect.top + rect.height / 2);
          var scaleRatio = newScale / currentScale;
          currentPanX = (currentPanX - offsetX / currentScale) + (offsetX / newScale);
          currentPanY = (currentPanY - offsetY / currentScale) + (offsetY / newScale);
        }
        currentScale = newScale;
        clampPan();
      }
      updateTransform(true);
    }

    function toggleZoom(clientX, clientY) {
      if (currentScale > 1.05) {
        setZoom(1);
      } else {
        setZoom(2.2, clientX, clientY);
      }
    }

    function clampPan() {
      if (!imgWrap || !imgEl) return;
      var w = imgWrap.clientWidth;
      var h = imgWrap.clientHeight;
      var maxPanX = Math.max(0, (w * (currentScale - 1)) / (2 * currentScale));
      var maxPanY = Math.max(0, (h * (currentScale - 1)) / (2 * currentScale));
      currentPanX = Math.max(-maxPanX, Math.min(maxPanX, currentPanX));
      currentPanY = Math.max(-maxPanY, Math.min(maxPanY, currentPanY));
    }

    function onPointerDown(e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isPointerDown = true;
      startX = e.clientX;
      startY = e.clientY;
      startPanX = currentPanX;
      startPanY = currentPanY;
      moveDistance = 0;
      touchStartX = e.clientX;
      touchStartY = e.clientY;

      if (currentScale > 1.05) {
        isDragging = true;
        if (imgWrap) imgWrap.classList.add('is-dragging');
        if (e.target && e.target.setPointerCapture) {
          try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
        }
      }
    }

    function onPointerMove(e) {
      if (!isPointerDown) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      moveDistance = Math.hypot(dx, dy);

      if (isDragging && currentScale > 1.05) {
        currentPanX = startPanX + dx / currentScale;
        currentPanY = startPanY + dy / currentScale;
        clampPan();
        updateTransform(false);
      }
    }

    function onPointerUp(e) {
      if (!isPointerDown) return;
      isPointerDown = false;

      if (isDragging) {
        isDragging = false;
        if (imgWrap) imgWrap.classList.remove('is-dragging');
        clampPan();
        updateTransform(true);
      }

      // Check for tap / click without drag
      if (moveDistance < 6) {
        if (e.target === imgEl || (imgWrap && imgWrap.contains(e.target))) {
          toggleZoom(e.clientX, e.clientY);
        }
      } else if (currentScale <= 1.05) {
        // Touch swipe when not zoomed
        var swipeDx = e.clientX - touchStartX;
        var swipeDy = e.clientY - touchStartY;
        if (Math.abs(swipeDx) > 40 && Math.abs(swipeDx) > Math.abs(swipeDy)) {
          if (swipeDx < 0) showNext();
          else showPrev();
        }
      }
    }

    function onWheel(e) {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.2 : 0.82;
      setZoom(currentScale * factor, e.clientX, e.clientY);
    }

    function onKeyDown(e) {
      if (!overlay || overlay.style.display === 'none') return;
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowRight':
          showNext();
          break;
        case 'ArrowLeft':
          showPrev();
          break;
        case '+':
        case '=':
          setZoom(currentScale + 0.5);
          break;
        case '-':
        case '_':
          setZoom(currentScale - 0.5);
          break;
        case '0':
          setZoom(1);
          break;
        case 'f':
        case 'F':
          if (!document.fullscreenElement) {
            if (overlay.requestFullscreen) overlay.requestFullscreen();
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
          }
          break;
      }
    }

    function showImage(index, direction) {
      if (!galleryItems.length || !imgEl) return;
      if (isAnimating) return;

      var prevIndex = currentIndex;
      currentIndex = (index + galleryItems.length) % galleryItems.length;
      var item = galleryItems[currentIndex];

      var totalStr = galleryItems.length < 10 ? '0' + galleryItems.length : '' + galleryItems.length;
      var curStr = (currentIndex + 1) < 10 ? '0' + (currentIndex + 1) : '' + (currentIndex + 1);
      if (counterEl) counterEl.textContent = curStr + ' / ' + totalStr;

      var cleanTitle = (item.alt || '').replace(/\s*[—–\-]\s*(Starquest|Wings of Wanitu|Home Run Derby|Outpost Red|Tide Hollow).*/i, '').trim();
      if (titleEl) titleEl.textContent = cleanTitle || item.alt || '';

      if (direction) {
        isAnimating = true;
        var outClass = direction === 'next' ? 'slide-next-out' : 'slide-prev-out';
        var inClass = direction === 'next' ? 'slide-next-in' : 'slide-prev-in';

        imgEl.classList.add(outClass);

        setTimeout(function () {
          imgEl.src = item.src;
          imgEl.alt = item.alt;
          setZoom(1);
          imgEl.classList.remove(outClass);
          imgEl.classList.add(inClass);

          setTimeout(function () {
            imgEl.classList.remove(inClass);
            isAnimating = false;
          }, 320);
        }, 140);
      } else {
        imgEl.src = item.src;
        imgEl.alt = item.alt;
        setZoom(1);
      }
    }

    function showNext() {
      showImage(currentIndex + 1, 'next');
    }

    function showPrev() {
      showImage(currentIndex - 1, 'prev');
    }

    function openLightbox(indexOrSrc, optAlt) {
      buildLightboxDOM();
      var targetIndex = 0;

      if (typeof indexOrSrc === 'number') {
        targetIndex = indexOrSrc;
      } else if (typeof indexOrSrc === 'string') {
        var found = -1;
        for (var i = 0; i < galleryItems.length; i++) {
          if (galleryItems[i].src === indexOrSrc || galleryItems[i].rawSrc === indexOrSrc) {
            found = i;
            break;
          }
        }
        if (found !== -1) {
          targetIndex = found;
        } else {
          galleryItems.push({ src: indexOrSrc, rawSrc: indexOrSrc, alt: optAlt || '' });
          targetIndex = galleryItems.length - 1;
        }
      }

      showImage(targetIndex);

      overlay.style.display = 'flex';
      // Trigger reflow for CSS opacity transition
      void overlay.offsetWidth;
      overlay.classList.add('is-active');

      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeyDown);
    }

    function closeLightbox() {
      if (!overlay || overlay.style.display === 'none') return;
      overlay.classList.remove('is-active');
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
      setTimeout(function () {
        overlay.style.display = 'none';
        if (imgEl) imgEl.src = '';
        setZoom(1);
      }, 300);
    }

    // Expose global openLightbox for backward compatibility
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;

    // Scan page for gallery items
    function scanGallery() {
      galleryItems = [];
      var candidates = document.querySelectorAll('section img, main .overflow-hidden img, .masonry-item img, .feat-row img');
      var seen = {};

      Array.prototype.forEach.call(candidates, function (img) {
        var src = img.getAttribute('src');
        if (!src) return;

        // Ignore small UI elements, logos, icons, avatars, external difficulty preview, thumbnails, and ANY anchor tag
        if (img.closest('a') ||
            img.closest('.project-card') ||
            img.closest('.project-nav-card') ||
            img.closest('.cross-link-card') ||
            img.closest('nav') ||
            img.closest('footer') ||
            img.closest('header') ||
            img.closest('.tool-chip') ||
            img.closest('.site-toggles') ||
            src.indexOf('logos/') !== -1 ||
            src.indexOf('icon') !== -1 ||
            src.indexOf('select-difficulty') !== -1 ||
            src.indexOf('logo') !== -1 ||
            src.indexOf('thumbs/') !== -1) {
          return;
        }

        if (seen[src]) return;
        seen[src] = true;

        var container = img.closest('.overflow-hidden') || img.closest('.masonry-item') || img.parentElement;
        if (!container || container.tagName === 'A' || container.closest('a') || container.classList.contains('project-card')) return;

        var alt = img.getAttribute('alt') || '';
        var idx = galleryItems.length;
        galleryItems.push({
          src: src,
          rawSrc: src,
          alt: alt,
          el: img
        });

        container.classList.add('gallery-zoom-target');
        container.setAttribute('tabindex', '0');
        container.setAttribute('role', 'button');
        container.setAttribute('aria-label', (alt ? alt + ' — ' : '') + (getLang() === 'fr' ? 'Agrandir en plein écran' : 'Enlarge image'));

        if (!container.querySelector('.gallery-zoom-badge')) {
          var badge = document.createElement('span');
          badge.className = 'gallery-zoom-badge';
          badge.setAttribute('aria-hidden', 'true');
          badge.innerHTML = ZOOM_SVG + '<span class="i18n" data-en="Zoom" data-fr="Zoom">Zoom</span>';
          container.appendChild(badge);
        }

        function trigger(e) {
          e.preventDefault();
          openLightbox(idx);
        }

        container.addEventListener('click', trigger);
        container.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            trigger(e);
          }
        });
      });
    }

    scanGallery();
    if (!galleryItems.length) return;
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
    setupMobileMenu();
    setupGalleryLightbox();

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
