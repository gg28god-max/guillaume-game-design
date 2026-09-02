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

    function validateStep(n, showErrors) {
      if (n === 1) {
        return root.querySelectorAll('.option-card[data-option-group="scope"] input:checked').length > 0;
      }
      if (n === 2) {
        var req2 = root.querySelectorAll('.flow-step[data-step="2"] [required]');
        var valid2 = true;
        for (var i = 0; i < req2.length; i++) {
          var el2 = req2[i];
          if (!el2.value.trim()) {
            valid2 = false;
            if (showErrors) el2.classList.add('border-amber-400/80');
          } else {
            el2.classList.remove('border-amber-400/80');
          }
        }
        return valid2;
      }
      if (n === 3) {
        var req3 = root.querySelectorAll('.flow-step[data-step="3"] [required]');
        var valid3 = true;
        for (var j = 0; j < req3.length; j++) {
          var el3 = req3[j];
          if (!el3.value.trim()) {
            valid3 = false;
            if (showErrors) el3.classList.add('border-amber-400/80');
          } else {
            el3.classList.remove('border-amber-400/80');
          }
        }
        var email = root.querySelector('.flow-step[data-step="3"] input[type="email"]');
        if (email) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            valid3 = false;
            if (showErrors) email.classList.add('border-amber-400/80');
          } else {
            email.classList.remove('border-amber-400/80');
          }
        }
        return valid3;
      }
      return true;
    }

    function updateNextState(n) {
      var btn = root.querySelector('.flow-step[data-step="' + n + '"] [data-flow-next]');
      if (!btn) return;
      var valid = validateStep(n, false);
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
        if (!validateStep(n, true)) return;
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
          if (!validateStep(s, true)) {
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
        var customOpt = root.querySelector('.option-card input[value="Custom Scope / Special Request"]');
        var firstOption = customOpt || root.querySelector('.option-card input[type="checkbox"], .option-card input[type="radio"]');
        if (firstOption) {
          firstOption.checked = true;
          firstOption.closest('.option-card').classList.add('is-selected');
          updateNextState(1);
        }
        var notesArea = root.querySelector('textarea[name="notes"]');
        if (notesArea && !notesArea.value.trim()) {
          notesArea.value = (currentLang() === 'fr' 
            ? "Je souhaite discuter d'un projet sur mesure / message libre." 
            : "I would like to discuss a custom project scope / open consultation.");
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
      var serviceName = root.getAttribute('data-service-name') || 'Service';

      var checkedScopeCards = Array.prototype.slice.call(root.querySelectorAll('.option-card[data-option-group="scope"] input:checked')).map(function (input) {
        return input.closest('.option-card');
      });

      var scopeTitles = checkedScopeCards.map(function (card) {
        var titleEl = card.querySelector('.option-title');
        return titleEl ? titleEl.textContent.trim() : card.textContent.trim();
      });

      var userBudget = fieldValue('budget');
      var projectName = fieldValue('project');
      var stage = fieldValue('stage');
      var format = fieldValue('format');
      var style = fieldValue('style');
      var engine = fieldValue('engine');
      var notes = fieldValue('notes');
      var refLink = fieldValue('references');
      var deadline = fieldValue('deadline');
      var company = fieldValue('company');

      var checkedCoverage = [];
      Array.prototype.forEach.call(root.querySelectorAll('input[name="coverage"]:checked'), function (cb) {
        var labelEl = cb.closest('.chip-option');
        checkedCoverage.push(labelEl ? labelEl.textContent.trim() : cb.value);
      });

      var checkIconSvg = '<svg class="w-3.5 h-3.5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';

      var html = '<div class="space-y-6">';

      // 1. Top Header Row: Service Title + Estimated Investment Badge
      html += '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">';
      html += '<div>';
      html += '<div class="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-300 mb-1">' + (lang === 'fr' ? 'SERVICE SÉLECTIONNÉ' : 'SELECTED SERVICE') + '</div>';
      html += '<div class="text-lg font-bold text-white tracking-tight">' + escapeHtml(serviceName) + '</div>';
      html += '</div>';

      html += '<div class="sm:text-right flex flex-col sm:items-end">';
      html += '<div class="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-1">' + (lang === 'fr' ? 'INVESTISSEMENT ESTIMÉ' : 'ESTIMATED INVESTMENT') + '</div>';
      html += '<div class="inline-flex items-center px-3.5 py-1.5 rounded-full bg-amber-400/10 text-amber-300 font-mono font-bold text-xs tracking-wide">' + escapeHtml(userBudget || (lang === 'fr' ? 'Flexible' : 'Flexible')) + '</div>';
      html += '</div>';
      html += '</div>';

      // 2. Deliverables / Scopes as Badge Chips
      if (scopeTitles.length > 0) {
        html += '<div>';
        html += '<div class="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2.5">' + (lang === 'fr' ? 'LIVRABLES SÉLECTIONNÉS' : 'SELECTED DELIVERABLES &amp; SCOPES') + '</div>';
        html += '<div class="flex flex-wrap gap-2">';
        scopeTitles.forEach(function (t) {
          html += '<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950/80 text-neutral-200 text-xs font-medium">' + checkIconSvg + '<span>' + escapeHtml(t) + '</span></div>';
        });
        html += '</div>';
        html += '</div>';
      }

      // 3. Grid for Metadata (Project Name, Stage, Format, Style, Engine, Deadline, Company)
      var metaCards = [];
      if (projectName) metaCards.push({ label: lang === 'fr' ? 'Nom du projet' : 'Project Name', val: projectName });
      if (stage) metaCards.push({ label: lang === 'fr' ? 'Étape de production' : 'Production Stage', val: stage });
      if (format) metaCards.push({ label: lang === 'fr' ? 'Format de livrable' : 'Deliverable Format', val: format });
      if (style) metaCards.push({ label: lang === 'fr' ? 'Style visuel' : 'Visual Style', val: style });
      if (engine) metaCards.push({ label: lang === 'fr' ? 'Moteur cible' : 'Target Engine', val: engine });
      if (checkedCoverage.length) metaCards.push({ label: lang === 'fr' ? 'Couverture pipeline' : 'Pipeline Coverage', val: checkedCoverage.join(', ') });
      if (deadline) metaCards.push({ label: lang === 'fr' ? 'Échéance cible' : 'Target Deadline', val: deadline });
      if (company) metaCards.push({ label: lang === 'fr' ? 'Studio / Entreprise' : 'Studio / Company', val: company });

      if (metaCards.length > 0) {
        html += '<div class="grid sm:grid-cols-2 gap-3 pt-4 border-t border-neutral-800/80">';
        metaCards.forEach(function (card) {
          html += '<div class="p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-950/50">';
          html += '<div class="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mb-1">' + escapeHtml(card.label) + '</div>';
          html += '<div class="text-xs font-medium text-neutral-200 truncate">' + escapeHtml(card.val) + '</div>';
          html += '</div>';
        });
        html += '</div>';
      }

      // 4. Attachments & Links
      if (attachedFiles.length > 0 || refLink) {
        html += '<div class="pt-4 border-t border-neutral-800/80">';
        html += '<div class="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2">' + (lang === 'fr' ? 'RÉFÉRENCES &amp; FICHIERS' : 'REFERENCES &amp; ATTACHMENTS') + '</div>';
        html += '<div class="flex flex-wrap gap-2">';
        if (refLink) {
          html += '<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950/80 text-amber-300 text-xs font-mono truncate max-w-full"><svg class="w-3.5 h-3.5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg><span class="truncate max-w-[280px]">' + escapeHtml(refLink) + '</span></div>';
        }
        attachedFiles.forEach(function (f) {
          var sizeKb = Math.round(f.size / 1024);
          var sizeStr = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';
          html += '<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950/80 text-neutral-200 text-xs font-mono"><svg class="w-3.5 h-3.5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg><span class="truncate max-w-[200px]">' + escapeHtml(f.name) + '</span><span class="text-[10px] text-neutral-500">(' + sizeStr + ')</span></div>';
        });
        html += '</div>';
        html += '</div>';
      }

      // 5. Brief Notes
      if (notes) {
        html += '<div class="pt-4 border-t border-neutral-800/80">';
        html += '<div class="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2">' + (lang === 'fr' ? 'NOTES DU BRIEF' : 'TECHNICAL &amp; FUNCTIONAL NOTES') + '</div>';
        html += '<div class="p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-950/50 text-xs text-neutral-300 leading-relaxed font-sans break-words">' + escapeHtml(notes) + '</div>';
        html += '</div>';
      }

      html += '</div>';

      summaryEl.innerHTML = html;

      if (sendBtn) {
        var toEmail = root.getAttribute('data-service-email') || 'gg28.god@gmail.com';
        var subject = 'New Project Inquiry — ' + serviceName + (scopeTitles.length ? ' (' + scopeTitles.join(', ') + ')' : '');

        var body = 'SERVICE: ' + serviceName + '\n';
        if (scopeTitles.length) body += 'SCOPES: ' + scopeTitles.join(' • ') + '\n';
        if (userBudget) body += 'ESTIMATED INVESTMENT: ' + userBudget + '\n';
        metaCards.forEach(function (c) {
          body += c.label.toUpperCase() + ': ' + c.val + '\n';
        });
        if (refLink) body += 'REFERENCE LINK: ' + refLink + '\n';
        if (attachedFiles.length) body += 'ATTACHED FILES: ' + attachedFiles.map(function(f){ return f.name; }).join(', ') + '\n';
        if (notes) body += 'NOTES: ' + notes + '\n';

        var clientName = fieldValue('name');
        var clientEmail = fieldValue('email');
        if (clientName) body += 'CLIENT NAME: ' + clientName + '\n';
        if (clientEmail) body += 'CLIENT EMAIL: ' + clientEmail + '\n';

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
