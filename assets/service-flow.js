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
        return root.querySelectorAll('.option-card[data-option-group="scope"] input:checked').length > 0;
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

    // Option cards (checkboxes or radios) in Step 1
    Array.prototype.forEach.call(root.querySelectorAll('.option-card input'), function (input) {
      input.addEventListener('change', function () {
        var card = input.closest('.option-card');
        if (input.type === 'radio') {
          var group = card.getAttribute('data-option-group');
          Array.prototype.forEach.call(root.querySelectorAll('.option-card[data-option-group="' + group + '"]'), function (c) {
            c.classList.remove('is-selected');
          });
          if (input.checked) card.classList.add('is-selected');
        } else {
          card.classList.toggle('is-selected', input.checked);
        }
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

    // File upload & Link attachment handling
    var attachedFiles = [];
    var fileInput = root.querySelector('[data-flow-file-input]');
    var filePreviewList = root.querySelector('[data-flow-file-previews]');
    var linkToggleBtn = root.querySelector('[data-flow-link-toggle]');
    var linkContainer = root.querySelector('[data-flow-link-container]');
    var linkInput = root.querySelector('input[name="references"]');

    if (linkToggleBtn && linkContainer) {
      linkToggleBtn.addEventListener('click', function () {
        linkContainer.classList.toggle('hidden');
        if (!linkContainer.classList.contains('hidden') && linkInput) {
          linkInput.focus();
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (!fileInput.files || !fileInput.files.length) return;
        for (var i = 0; i < fileInput.files.length; i++) {
          attachedFiles.push(fileInput.files[i]);
        }
        renderFilePreviews();
        updateNextState(2);
        buildSummary();
      });
    }

    function renderFilePreviews() {
      if (!filePreviewList) return;
      filePreviewList.innerHTML = '';
      if (!attachedFiles.length) return;

      attachedFiles.forEach(function (file, idx) {
        var chip = document.createElement('div');
        chip.className = 'file-preview-chip';

        var isImg = file.type && file.type.indexOf('image/') === 0;
        var iconOrThumb = isImg
          ? '<img src="' + URL.createObjectURL(file) + '" alt="' + escapeHtml(file.name) + '"/>'
          : '<svg class="w-3.5 h-3.5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>';

        var sizeKb = Math.round(file.size / 1024);
        var sizeStr = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';

        chip.innerHTML = iconOrThumb +
          '<span class="truncate max-w-[140px] sm:max-w-[200px]" title="' + escapeHtml(file.name) + '">' + escapeHtml(file.name) + '</span>' +
          '<span class="text-[10px] text-neutral-500 font-mono">(' + sizeStr + ')</span>' +
          '<button type="button" class="file-remove-btn" data-remove-idx="' + idx + '" aria-label="Remove">&times;</button>';

        filePreviewList.appendChild(chip);
      });

      Array.prototype.forEach.call(filePreviewList.querySelectorAll('[data-remove-idx]'), function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var idx = Number(btn.getAttribute('data-remove-idx'));
          attachedFiles.splice(idx, 1);
          renderFilePreviews();
          buildSummary();
        });
      });
    }

    function buildSummary() {
      var summaryEl = root.querySelector('[data-flow-summary]');
      var sendBtn = root.querySelector('[data-flow-send]');
      if (!summaryEl) return;

      var lang = currentLang();
      var labels = lang === 'fr'
        ? { scope: 'Portée / Livrable', project: 'Nom du projet', stage: 'Étape de production', format: 'Format de livrable', style: 'Style visuel', coverage: 'Couverture pipeline', engine: 'Moteur cible', budgetOpt: 'Budget optimisation', concept: 'Concept fourni ?', platform: 'Plateforme & Entrées', state: 'État actuel du projet', handoff: 'Livrable attendu', dimensions: 'Dimensions / Ratio', usage: 'Usage commercial', deadline: 'Échéance cible', budget: 'Fourchette budget', company: 'Studio / Entreprise', references: 'Liens de référence', notes: 'Notes techniques & fonctionnelles', name: 'Nom', email: 'Courriel' }
        : { scope: 'Scope / Deliverable', project: 'Project Name', stage: 'Production Stage', format: 'Deliverable Format', style: 'Visual Style', coverage: 'Pipeline Coverage', engine: 'Target Engine', budgetOpt: 'Optimization Budget', concept: 'Concept Provided?', platform: 'Platform & Inputs', state: 'Current Project State', handoff: 'Handoff Requirement', dimensions: 'Target Dimensions', usage: 'Commercial Usage', deadline: 'Target Deadline', budget: 'Budget Range', company: 'Studio / Company', references: 'Reference Links', notes: 'Technical & Functional Notes', name: 'Name', email: 'Email' };

      var serviceName = root.getAttribute('data-service-name') || 'Service';
      var checkedScopeCards = Array.prototype.slice.call(root.querySelectorAll('.option-card[data-option-group="scope"] input:checked')).map(function (input) {
        return input.closest('.option-card');
      });

      var scopeTitles = checkedScopeCards.map(function (card) {
        var titleEl = card.querySelector('.option-title');
        return titleEl ? titleEl.textContent.trim() : card.textContent.trim();
      });

      var userBudget = fieldValue('budget');

      // Collect checked chips for multi-select groups (e.g., coverage)
      var checkedCoverage = [];
      Array.prototype.forEach.call(root.querySelectorAll('input[name="coverage"]:checked'), function (cb) {
        var labelEl = cb.closest('.chip-option');
        checkedCoverage.push(labelEl ? labelEl.textContent.trim() : cb.value);
      });

      var serviceScopeLabel = lang === 'fr' ? (scopeTitles.length > 1 ? 'Service & Portées' : 'Service & Portée') : (scopeTitles.length > 1 ? 'Service & Scopes' : 'Service & Scope');
      var estimatedInvestLabel = lang === 'fr' ? 'Investissement estimé (Sélectionné)' : 'Estimated Investment (Selected)';
      var filesLabel = lang === 'fr' ? 'Images & Fichiers joints' : 'Attached Images & Files';

      // Scopes stacked vertically
      var scopesContent = '<div class="font-semibold text-neutral-100 text-sm mb-1.5">' + escapeHtml(serviceName) + '</div>';
      if (scopeTitles.length > 0) {
        scopesContent += '<ul class="space-y-1.5 pl-3 border-l-2 border-amber-400/60 mt-2">' +
          scopeTitles.map(function (title) {
            return '<li class="text-xs text-neutral-300 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block shrink-0"></span>' + escapeHtml(title) + '</li>';
          }).join('') +
          '</ul>';
      }

      // Investment value: strictly the user-selected budget from Step 2
      var investmentDisplay = userBudget
        ? '<span class="font-bold text-amber-300 font-mono text-sm tracking-wide">' + escapeHtml(userBudget) + '</span>'
        : '<span class="text-neutral-500 text-xs italic">' + (lang === 'fr' ? 'Flexible / À discuter' : 'Flexible / To be discussed') + '</span>';

      // Attached files stacked vertically
      var attachedFilesHtml = '';
      if (attachedFiles.length > 0) {
        attachedFilesHtml = '<ul class="space-y-1.5 pl-3 border-l-2 border-amber-400/60 mt-2">' +
          attachedFiles.map(function (f) {
            var sizeKb = Math.round(f.size / 1024);
            var sizeStr = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';
            return '<li class="text-xs text-neutral-300 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block shrink-0"></span>' + escapeHtml(f.name) + ' <span class="text-[10px] text-neutral-500 font-mono">(' + sizeStr + ')</span></li>';
          }).join('') +
          '</ul>';
      }

      // Coverage items stacked vertically
      var coverageHtml = '';
      if (checkedCoverage.length > 0) {
        coverageHtml = '<ul class="space-y-1.5 pl-3 border-l-2 border-amber-400/60 mt-2">' +
          checkedCoverage.map(function (c) {
            return '<li class="text-xs text-neutral-300 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block shrink-0"></span>' + escapeHtml(c) + '</li>';
          }).join('') +
          '</ul>';
      }

      var items = [
        { label: serviceScopeLabel, html: scopesContent, raw: serviceName + (scopeTitles.length ? ' — ' + scopeTitles.join(', ') : '') },
        { label: estimatedInvestLabel, html: investmentDisplay, raw: userBudget || 'Flexible' },
        { label: labels.project, value: fieldValue('project') },
        { label: labels.stage, value: fieldValue('stage') },
        { label: labels.format, value: fieldValue('format') },
        { label: labels.style, value: fieldValue('style') },
        { label: labels.coverage, html: coverageHtml, raw: checkedCoverage.join(', ') },
        { label: labels.engine, value: fieldValue('engine') },
        { label: labels.budgetOpt, value: fieldValue('optimization') },
        { label: labels.concept, value: fieldValue('concept_provided') },
        { label: labels.platform, value: fieldValue('platform') },
        { label: labels.state, value: fieldValue('project_state') },
        { label: labels.handoff, value: fieldValue('handoff') },
        { label: labels.dimensions, value: fieldValue('dimensions') },
        { label: labels.usage, value: fieldValue('commercial_usage') },
        { label: labels.deadline, value: fieldValue('deadline') },
        { label: labels.company, value: fieldValue('company') },
        { label: labels.references, value: fieldValue('references') },
        { label: filesLabel, html: attachedFilesHtml, raw: attachedFiles.map(function(f){ return f.name; }).join(', ') },
        { label: labels.notes, value: fieldValue('notes') },
        { label: labels.name, value: fieldValue('name') },
        { label: labels.email, value: fieldValue('email') }
      ].filter(function (it) {
        return it.html || (it.value && it.value.trim().length > 0);
      });

      summaryEl.innerHTML = '<div class="space-y-4">' +
        items.map(function (it) {
          var val = it.html || ('<div class="text-sm font-medium text-neutral-200 break-words">' + escapeHtml(it.value) + '</div>');
          return '<div class="flow-summary-row pb-3.5 border-b border-neutral-800/60 last:border-b-0">' +
            '<div class="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">' + escapeHtml(it.label) + '</div>' +
            val +
            '</div>';
        }).join('') +
        '</div>';

      if (sendBtn) {
        var serviceName = root.getAttribute('data-service-name') || 'Service';
        var toEmail = root.getAttribute('data-service-email') || 'gg28.god@gmail.com';
        var subject = 'New Project Inquiry — ' + serviceName + (scopeTitles.length ? ' (' + scopeTitles.join(', ') + ')' : '');
        var body = items.map(function (it) {
          var textVal = it.value || it.raw || '';
          return textVal ? (it.label + ': ' + textVal) : '';
        }).filter(Boolean).join('\n');
        if (attachedFiles.length > 0) {
          body += '\n\n*Note: ' + attachedFiles.length + ' file(s) selected (' + attachedFiles.map(function (f) { return f.name; }).join(', ') + '). Please remember to attach these files directly to this email response before sending!';
        }
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
