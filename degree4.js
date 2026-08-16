// degree4.js – Logique spécifique aux leçons 4e année primaire
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    // ── Éléments de base ──
    const lessonContainer = document.getElementById('main-content');
    if (!lessonContainer) return;

    // ── Suivi des objectifs (checklist) ──
    const checkboxes = document.querySelectorAll('.goal-checkbox');
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const resetBtn = document.getElementById('reset-progress');
    const saveBtn = document.getElementById('save-progress');
    const resetConfirm = document.getElementById('reset-confirmation');
    const checkSound = document.getElementById('check-sound');
    const applauseSound = document.getElementById('applause-sound');
    let hasPlayedApplause = false;

    const STORAGE_KEY = 'ED_French_degree4_' + window.location.pathname.split('/').pop().replace('.html', '') + '_progress';

    function updateGoalStyle(checkbox) {
      const label = checkbox.nextElementSibling;
      if (label && label.classList.contains('goal-text')) {
        label.classList.toggle('completed', checkbox.checked);
      }
    }

    function updateProgressBar() {
      const total = checkboxes.length;
      const completed = document.querySelectorAll('.goal-checkbox:checked').length;
      const percentage = total ? Math.round((completed / total) * 100) : 0;
      if (progressBar) progressBar.style.width = percentage + '%';
      if (progressPercentage) progressPercentage.textContent = percentage + '%';

      if (percentage === 100 && !hasPlayedApplause) {
        if (applauseSound) {
          applauseSound.currentTime = 0;
          applauseSound.play().catch(() => {});
        }
        hasPlayedApplause = true;
        App.showToast('allGoalsCompleted', 'success');
        App.logGeneralAction('degree4_goals_completed');
      } else if (percentage < 100) {
        hasPlayedApplause = false;
      }
    }

    function loadProgress() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        const data = JSON.parse(saved);
        checkboxes.forEach(checkbox => {
          const id = checkbox.getAttribute('data-goal');
          checkbox.checked = !!data[id];
          updateGoalStyle(checkbox);
        });
        updateProgressBar();
      } catch (e) {}
    }

    function saveProgress() {
      const progress = {};
      checkboxes.forEach(checkbox => {
        progress[checkbox.getAttribute('data-goal')] = checkbox.checked;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      App.showToast('progressSaved', 'success');
      App.logGeneralAction('degree4_progress_saved');
    }

    function showResetConfirmation() {
      if (resetConfirm) {
        resetConfirm.classList.add('visible');
      }
    }

    function closeResetConfirmation() {
      if (resetConfirm) {
        resetConfirm.classList.remove('visible');
      }
    }

    function resetProgress() {
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        updateGoalStyle(checkbox);
      });
      updateProgressBar();
      localStorage.removeItem(STORAGE_KEY);
      hasPlayedApplause = false;
      closeResetConfirmation();
      App.showToast('progressReset', 'info');
      App.logGeneralAction('degree4_progress_reset');
    }

    // Événements de la checklist
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        updateGoalStyle(this);
        updateProgressBar();
        if (this.checked && checkSound) {
          checkSound.currentTime = 0;
          checkSound.play().catch(() => {});
        }
      });
    });

    if (saveBtn) saveBtn.addEventListener('click', saveProgress);
    if (resetBtn) resetBtn.addEventListener('click', showResetConfirmation);
    if (resetConfirm) {
      const cancelBtn = resetConfirm.querySelector('.confirmation-cancel');
      const confirmBtn = resetConfirm.querySelector('.confirmation-confirm');
      if (cancelBtn) cancelBtn.addEventListener('click', closeResetConfirmation);
      if (confirmBtn) confirmBtn.addEventListener('click', resetProgress);
    }

    // ── Lecture automatique du progrès ──
    loadProgress();

    // ── Auto‑évaluation et score ──
    const radios = document.querySelectorAll('.self-assessment input[type="radio"]');
    const scoreCorrect = document.getElementById('score-correct');
    const scorePartial = document.getElementById('score-partial');
    const scoreIncorrect = document.getElementById('score-incorrect');
    const scoreUnanswered = document.getElementById('score-unanswered');
    const saveResultsBtn = document.getElementById('saveResultsBtn');

    function updateScore() {
      let correct = 0, partial = 0, incorrect = 0, unanswered = 0;
      // Grouper par nom
      const groups = {};
      radios.forEach(radio => {
        const name = radio.name;
        if (!groups[name]) groups[name] = false;
        if (radio.checked) groups[name] true;
      });
      Object.values(groups).forEach(checked => {
        if (!checked) unanswered++;
      });

      radios.forEach(radio => {
        if (radio.checked) {
          if (radio.value === 'correct') correct++;
          else if (radio.value === 'partial') partial++;
          else if (radio.value === 'incorrect') incorrect++;
        }
      });

      if (scoreCorrect) scoreCorrect.textContent = correct;
      if (scorePartial) scorePartial.textContent = partial;
      if (scoreIncorrect) scoreIncorrect.textContent = incorrect;
      if (scoreUnanswered) scoreUnanswered.textContent = unanswered;
    }

    if (radios.length > 0) {
      radios.forEach(radio => radio.addEventListener('change', updateScore));
      updateScore();
    }

    // ── Sauvegarde des résultats dans le profil ──
    if (saveResultsBtn) {
      saveResultsBtn.addEventListener('click', async function() {
        const { data: { user } } = await App.supabase.auth.getUser();
        if (!user) {
          App.showToast('toast_signin_required', 'error');
          const signInBtn = document.getElementById('signInBtn');
          if (signInBtn) signInBtn.click();
          return;
        }

        // Récupérer les réponses d'auto‑évaluation
        const groups = {};
        radios.forEach(radio => {
          const name = radio.name;
          if (!groups[name]) groups[name] = null;
          if (radio.checked) groups[name] = radio.value;
        });

        const total = Object.keys(groups).length;
        const correct = Object.values(groups).filter(v => v === 'correct').length;
        const partial = Object.values(groups).filter(v => v === 'partial').length;
        const incorrect = Object.values(groups).filter(v => v === 'incorrect').length;
        const unanswered = total - correct - partial - incorrect;

        const lang = localStorage.getItem('lang') || 'fr';
        const entry = {
          lesson_id: window.location.pathname.split('/').pop().replace('.html', ''),
          lesson_title: {
            fr: App.getTranslation('lesson_short_title', 'fr'),
            en: App.getTranslation('lesson_short_title', 'en'),
            ar: App.getTranslation('lesson_short_title', 'ar')
          },
          year: {
            fr: "4ème année primaire",
            en: "4th grade primary",
            ar: "السنة الرابعة ابتدائي"
          },
          module: {
            fr: App.getTranslation('module_name', 'fr'),
            en: App.getTranslation('module_name', 'en'),
            ar: App.getTranslation('module_name', 'ar')
          },
          correct,
          partial,
          incorrect,
          unanswered,
          updated_at: new Date().toISOString()
        };

        const { data: profile, error: fetchError } = await App.supabase
          .from('profiles')
          .select('achivement')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          App.showToast('save_error', 'error');
          return;
        }

        const achivement = profile?.achivement || {};
        const edFrench = achivement["ED-French"] || [];
        const newEdFrench = edFrench.filter(item => item.lesson_id !== entry.lesson_id);
        newEdFrench.push(entry);

        const { error: updateError } = await App.supabase
          .from('profiles')
          .update({ achivement: { ...achivement, "ED-French": newEdFrench } })
          .eq('id', user.id);

        if (updateError) {
          App.showToast('save_error', 'error');
        } else {
          App.showToast('save_success', 'success');
          App.logUserAction('achievement_saved', { lesson: entry.lesson_id });
        }
      });
    }

    // ── Impression / PDF ──
    const printBtn = document.getElementById('printPdfBtn');
    if (printBtn) {
      printBtn.addEventListener('click', async function() {
        const { data: { user } } = await App.supabase.auth.getUser();
        if (!user) {
          App.showToast('toast_signin_required', 'error');
          const signInBtn = document.getElementById('signInBtn');
          if (signInBtn) signInBtn.click();
          return;
        }

        let isRegistered = false;
        try {
          const { data: profile, error } = await App.supabase
            .from('profiles')
            .select('registration_state')
            .eq('id', user.id)
            .single();
          if (!error && profile && profile.registration_state && profile.registration_state.active === true) {
            isRegistered = true;
          }
        } catch (e) {}

        const lang = localStorage.getItem('lang') || 'fr';
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="${lang}">
          <head>
            <meta charset="UTF-8">
            <title>${App.getTranslation('lesson_short_title', lang)}</title>
            <style>
              body { font-family: Georgia, serif; line-height: 1.6; max-width: 700px; margin: 2rem auto; padding: 0 1rem; color: #000; }
              .print-header { text-align: center; border-bottom: 2px solid #c75b2c; padding-bottom: 1rem; margin-bottom: 2rem; }
              .site-name { font-size: 1.4rem; font-weight: bold; color: #c75b2c; }
              .lesson-name { font-size: 1.1rem; font-weight: bold; margin-top: 0.5rem; }
              .print-footer { text-align: center; border-top: 1px solid #ccc; padding-top: 1rem; margin-top: 2rem; font-size: 0.85rem; color: #666; }
              h1, h2, h3 { color: #000; }
              .lesson-card, .text-card { background: #f8f4ec; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
              .goal-item { display: flex; align-items: flex-start; gap: 0.5rem; }
              .goal-checkbox { width: 18px; height: 18px; }
              .score-area { margin-top: 1.5rem; }
              .score-stat { display: inline-block; margin-right: 1rem; }
              @media print { body { margin: 0; padding: 0; } @page { margin: 2cm; } }
            </style>
          </head>
          <body>
            <div class="print-header">
              <div class="site-name">${App.getTranslation('print_site_name', lang)}</div>
              <div>${App.getTranslation('print_scholar_year', lang)} – ${App.getTranslation('print_week', lang)} – ${App.getTranslation('print_area', lang)}</div>
              <div class="lesson-name">${App.getTranslation('lesson_short_title', lang)}</div>
            </div>
            ${document.querySelector('.degree4-lesson').cloneNode(true).outerHTML}
            <p style="text-align:center; font-weight:bold;">${isRegistered ? App.getTranslation('print_with_answers', lang) : App.getTranslation('print_without_answers', lang)}</p>
            <div class="print-footer">
              ${App.getTranslation('print_footer_dev', lang)} – ${App.getTranslation('print_footer_date', lang)} ${new Date().toLocaleDateString('fr-FR')}
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
      });
    }

    // ── Mode lecture (toggle) ──
    const readingModeBtn = document.getElementById('readingModeToggle');
    if (readingModeBtn) {
      readingModeBtn.addEventListener('click', function() {
        document.body.classList.toggle('reading-mode');
        const isReading = document.body.classList.contains('reading-mode');
        App.showToast(isReading ? 'readingModeOn' : 'readingModeOff', 'info');
        App.logGeneralAction('degree4_reading_mode_' + (isReading ? 'on' : 'off'));
      });
    }

    // ── Bouton retour en haut ──
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
      window.addEventListener('scroll', function() {
        if (window.scrollY > 400) {
          backToTopBtn.classList.add('show');
        } else {
          backToTopBtn.classList.remove('show');
        }
      });
      backToTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // ── Appliquer les traductions après chargement dynamique ──
    if (typeof App.applyTranslations === 'function') {
      App.applyTranslations();
    }
  });
})();