/* ==========================================================================
   Guillaume Goder portfolio — service intake flow (Apple-buy-flow-style
   stepper with dynamic service-specific branching).
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
      var radio = root.querySelector('input[type="radio"][name="' + name + '"]:checked');
      if (radio) return radio.value.trim();
      var el = root.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    }

    function validateStep(n) {
      if (n === 1) {
        return !!selectedOption('scope');
      }
      if (n === 2) {
        var req2 = root.querySelectorAll('.flow-step[data-step="2"] [required]');
        for (var i = 0; i < req2.length; i++) {
          if (!req2[i].value.trim()) return false;
        }
        return true;
      }
      if (n === 3) {
        var req3 = root.querySelectorAll('.flow-step[data-step="3"] [required]');
        for (var j = 0; j < req3.length; j++) {
          if (!req3[j].value.trim()) return false;
        }
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

    // Radio option cards in Step 1
    Array.prototype.forEach.call(root.querySelectorAll('.option-card input[type="radio"]'), function (input) {
      input.addEventListener('change', function () {
        var card = input.closest('.option-card');
        var group = card.getAttribute('data-option-group');
        Array.prototype.forEach.call(root.querySelectorAll('.option-card[data-option-group="' + group + '"]'), function (c) {
          c.classList.remove('is-selected');
        });
        card.classList.add('is-selected');
        updateNextState(1);
      });
    });

    // Chip options (checkboxes or radios)
    Array.prototype.forEach.call(root.querySelectorAll('.chip-option input'), function (input) {
      input.addEventListener('change', function () {
        var chip = input.closest('.chip-option');
        if (input.type === 'radio') {
          var name = input.name;
          Array.prototype.forEach.call(root.querySelectorAll('input[name="' + name + '"]'), function (other) {
            var oChip = other.closest('.chip-option');
            if (oChip) oChip.classList.remove('is-selected');
          });
          if (input.checked) chip.classList.add('is-selected');
        } else {
          chip.classList.toggle('is-selected', input.checked);
        }
        updateNextState(2);
      });
    });

    // Inputs in Step 2 & 3
    Array.prototype.forEach.call(root.querySelectorAll('.flow-step[data-step="2"] input, .flow-step[data-step="2"] textarea, .flow-step[data-step="2"] select'), function (el) {
      el.addEventListener('input', function () { updateNextState(2); });
      el.addEventListener('change', function () { updateNextState(2); });
    });
    Array.prototype.forEach.call(root.querySelectorAll('.flow-step[data-step="3"] input, .flow-step[data-step="3"] select'), function (el) {
      el.addEventListener('input', function () { updateNextState(3); buildSummary(); });
      el.addEventListener('change', function () { updateNextState(3); buildSummary(); });
    });

    // Next / Back buttons
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

    // Step indicators as interactive buttons (jump back/forward)
    Array.prototype.forEach.call(progressSteps, function (p) {
      p.addEventListener('click', function () {
        var targetStep = Number(p.getAttribute('data-step'));
        if (targetStep === current) return;
        if (targetStep < current) {
          showStep(targetStep);
          return;
        }
        var canProceed = true;
        for (var s = current; s < targetStep; s++) {
          if (!validateStep(s)) {
            canProceed = false;
            break;
          }
        }
        if (canProceed) {
          showStep(targetStep);
        }
      });
    });

    // Escape hatch: "Not sure what you need yet? Send an open message"
    Array.prototype.forEach.call(root.querySelectorAll('[data-flow-escape]'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var firstOption = root.querySelector('.option-card input[type="radio"]');
        if (firstOption) {
          firstOption.checked = true;
          firstOption.closest('.option-card').classList.add('is-selected');
          updateNextState(1);
        }
        showStep(2);
      });
    });

    function buildSummary() {
      var summaryEl = root.querySelector('[data-flow-summary]');
      var sendBtn = root.querySelector('[data-flow-send]');
      if (!summaryEl) return;

      var lang = currentLang();
      var labels = lang === 'fr'
        ? { scope: 'Portée / Livrable', project: 'Projet', stage: 'Étape de prod.', format: 'Format', style: 'Style / Genre', coverage: 'Couverture pipeline', engine: 'Moteur cible', budgetOpt: 'Budget optimisation', concept: 'Concept fourni ?', platform: 'Plateforme', state: 'État actuel', handoff: 'Livrable attendu', dimensions: 'Dimensions / Ratio', usage: 'Usage commercial', deadline: 'Échéance', budget: 'Fourchette budget', company: 'Studio / Entreprise', notes: 'Notes & Références', name: 'Nom', email: 'Courriel' }
        : { scope: 'Scope / Deliverable', project: 'Project Name', stage: 'Production Stage', format: 'Deliverable Format', style: 'Visual Style', coverage: 'Pipeline Coverage', engine: 'Target Engine', budgetOpt: 'Optimization Budget', concept: 'Concept Provided?', platform: 'Platform & Inputs', state: 'Current Project State', handoff: 'Handoff Requirement', dimensions: 'Target Dimensions', usage: 'Commercial Usage', deadline: 'Target Deadline', budget: 'Budget Range', company: 'Studio / Company', notes: 'Notes & References', name: 'Name', email: 'Email' };

      var serviceName = root.getAttribute('data-service-name') || 'Service';
      var scopeCard = selectedOption('scope');
      var scopeTitle = scopeCard ? (scopeCard.querySelector('.option-title') ? scopeCard.querySelector('.option-title').textContent.trim() : scopeCard.textContent.trim()) : '';
      var estimatedRange = scopeCard ? (scopeCard.getAttribute('data-estimated') || scopeCard.getAttribute('data-price-range') || '') : '';
      var userBudget = fieldValue('budget');

      // Collect checked chips for multi-select groups (e.g., coverage)
      var checkedCoverage = [];
      Array.prototype.forEach.call(root.querySelectorAll('input[name="coverage"]:checked'), function (cb) {
        var labelEl = cb.closest('.chip-option');
        checkedCoverage.push(labelEl ? labelEl.textContent.trim() : cb.value);
      });

      var serviceScopeLabel = lang === 'fr' ? 'Service & Portée' : 'Service & Scope';
      var budgetBracketLabel = lang === 'fr' ? 'Fourchette budgétaire' : 'Budget Bracket';
      var estimatedInvestLabel = lang === 'fr' ? 'Investissement estimé' : 'Estimated Investment';
      var userSelectedNote = lang === 'fr' ? ' (sélectionné)' : ' (Selected by user)';

      var rows = [
        [serviceScopeLabel, serviceName + (scopeTitle ? ' — ' + scopeTitle : '')],
        [budgetBracketLabel, userBudget ? (userBudget + userSelectedNote) : ''],
        [estimatedInvestLabel, estimatedRange ? (estimatedRange + '*') : ''],
        [labels.project, fieldValue('project')],
        [labels.stage, fieldValue('stage')],
        [labels.format, fieldValue('format')],
        [labels.style, fieldValue('style')],
        [labels.coverage, checkedCoverage.join(', ')],
        [labels.engine, fieldValue('engine')],
        [labels.budgetOpt, fieldValue('optimization')],
        [labels.concept, fieldValue('concept_provided')],
        [labels.platform, fieldValue('platform')],
        [labels.state, fieldValue('project_state')],
        [labels.handoff, fieldValue('handoff')],
        [labels.dimensions, fieldValue('dimensions')],
        [labels.usage, fieldValue('commercial_usage')],
        [labels.deadline, fieldValue('deadline')],
        [labels.company, fieldValue('company')],
        [labels.notes, fieldValue('references') || fieldValue('notes')],
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

    // Keep summary in sync with language toggle
    Array.prototype.forEach.call(document.querySelectorAll('.lang-toggle-btn'), function (b) {
      b.addEventListener('click', function () { if (current === 3) setTimeout(buildSummary, 0); });
    });

    // Check URL parameters for preselected scope or service
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var preScope = urlParams.get('scope');
      if (preScope) {
        var targetRadio = root.querySelector('.option-card input[value="' + preScope + '"]');
        if (targetRadio) {
          targetRadio.checked = true;
          targetRadio.closest('.option-card').classList.add('is-selected');
          updateNextState(1);
        }
      }
    } catch (e) {}

    showStep(1);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-flow-root]'), initFlow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
