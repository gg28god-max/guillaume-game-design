/* ==========================================================================
   Guillaume Goder portfolio — service intake flow (Apple-buy-flow-style
   stepper used by every service-*.html page). No backend: the last step
   builds a plain mailto: link from whatever was entered, so "Send Inquiry"
   is exactly what it looks like.
   ========================================================================== */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function currentLang() {
    return document.documentElement.getAttribute('data-lang') === 'fr' ? 'fr' : 'en';
  }

  function initFlow(root) {
    var steps = Array.prototype.slice.call(root.querySelectorAll('.flow-step'));
    var progressSteps = Array.prototype.slice.call(root.querySelectorAll('.flow-progress-step'));
    var progressLines = Array.prototype.slice.call(root.querySelectorAll('.flow-progress-line'));
    var current = 1;

    function showStep(n) {
      current = n;
      steps.forEach(function (s) {
        s.classList.toggle('is-current', Number(s.getAttribute('data-step')) === n);
      });
      progressSteps.forEach(function (p) {
        var num = Number(p.getAttribute('data-step'));
        p.classList.toggle('is-active', num === n);
        p.classList.toggle('is-done', num < n);
      });
      progressLines.forEach(function (l, i) {
        l.classList.toggle('is-done', (i + 1) < n);
      });
      if (n === 3) buildSummary();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function selectedOption(group) {
      return root.querySelector('.option-card[data-option-group="' + group + '"].is-selected');
    }

    function fieldValue(name) {
      var el = root.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    }

    function validateStep(n) {
      if (n === 1) return !!selectedOption('scope');
      if (n === 2) {
        var req2 = root.querySelectorAll('.flow-step[data-step="2"] [required]');
        for (var i = 0; i < req2.length; i++) { if (!req2[i].value.trim()) return false; }
        return true;
      }
      if (n === 3) {
        var req3 = root.querySelectorAll('.flow-step[data-step="3"] [required]');
        for (var j = 0; j < req3.length; j++) { if (!req3[j].value.trim()) return false; }
        var email = root.querySelector('.flow-step[data-step="3"] input[type="email"]');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return false;
        return true;
      }
      return true;
    }

    function updateNextState(n) {
      var btn = root.querySelector('.flow-step[data-step="' + n + '"] [data-flow-next]');
      if (!btn) return;
      var valid = validateStep(n);
      btn.disabled = !valid;
      btn.classList.toggle('opacity-40', !valid);
      btn.classList.toggle('pointer-events-none', !valid);
    }

    Array.prototype.forEach.call(root.querySelectorAll('.option-card input[type="radio"]'), function (input) {
      input.addEventListener('change', function () {
        var group = input.closest('.option-card').getAttribute('data-option-group');
        Array.prototype.forEach.call(root.querySelectorAll('.option-card[data-option-group="' + group + '"]'), function (c) {
          c.classList.remove('is-selected');
        });
        input.closest('.option-card').classList.add('is-selected');
        updateNextState(1);
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll('.flow-step[data-step="2"] input, .flow-step[data-step="2"] textarea'), function (el) {
      el.addEventListener('input', function () { updateNextState(2); });
    });
    Array.prototype.forEach.call(root.querySelectorAll('.flow-step[data-step="3"] input'), function (el) {
      el.addEventListener('input', function () { updateNextState(3); buildSummary(); });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-flow-next]'), function (btn) {
      btn.addEventListener('click', function () {
        var n = Number(btn.closest('.flow-step').getAttribute('data-step'));
        if (!validateStep(n)) return;
        showStep(n + 1);
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-flow-back]'), function (btn) {
      btn.addEventListener('click', function () {
        var n = Number(btn.closest('.flow-step').getAttribute('data-step'));
        showStep(n - 1);
      });
    });

    function buildSummary() {
      var summaryEl = root.querySelector('[data-flow-summary]');
      var sendBtn = root.querySelector('[data-flow-send]');
      if (!summaryEl) return;

      var lang = currentLang();
      var labels = lang === 'fr'
        ? { scope: 'Portée', project: 'Projet', references: 'Références', deadline: 'Échéance', budget: 'Budget', notes: 'Notes', name: 'Nom', email: 'Courriel' }
        : { scope: 'Scope', project: 'Project', references: 'References', deadline: 'Deadline', budget: 'Budget', notes: 'Notes', name: 'Name', email: 'Email' };

      var scopeCard = selectedOption('scope');
      var scopeTitle = scopeCard ? scopeCard.querySelector('.option-title').textContent.trim() : '';

      var rows = [
        [labels.scope, scopeTitle],
        [labels.project, fieldValue('project')],
        [labels.references, fieldValue('references')],
        [labels.deadline, fieldValue('deadline')],
        [labels.budget, fieldValue('budget')],
        [labels.notes, fieldValue('notes')],
        [labels.name, fieldValue('name')],
        [labels.email, fieldValue('email')]
      ].filter(function (r) { return r[1]; });

      summaryEl.innerHTML = rows.map(function (r) {
        return '<div class="flow-summary-row flex justify-between gap-6 py-2.5">' +
          '<dt class="text-neutral-500">' + escapeHtml(r[0]) + '</dt>' +
          '<dd class="text-neutral-100 text-right">' + escapeHtml(r[1]) + '</dd></div>';
      }).join('');

      if (sendBtn) {
        var serviceName = root.getAttribute('data-service-name') || 'Service';
        var toEmail = root.getAttribute('data-service-email') || 'gg28.god@gmail.com';
        var subject = 'New Project Inquiry — ' + serviceName + (scopeTitle ? ' (' + scopeTitle + ')' : '');
        var body = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
        sendBtn.href = 'mailto:' + toEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      }
    }

    // Keep the summary's labels/scope title in sync if the language is
    // switched while already reviewing on step 3.
    Array.prototype.forEach.call(document.querySelectorAll('.lang-toggle-btn'), function (b) {
      b.addEventListener('click', function () { if (current === 3) setTimeout(buildSummary, 0); });
    });

    showStep(1);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-flow-root]'), initFlow);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
