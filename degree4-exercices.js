/**
 * degree4-exercices.js
 * Two independent exercise processors:
 *   1. Text input – prefix: degree4LessonTypeReadingTextInput...
 *   2. Dropdown    – prefix: degree4LessonTypeReadingDropdown...
 *   3. Matching    – prefix: degree4LessonTypeReadingMatching...
 *
 * Text input has two subtypes:
 *   - Plain text questions
 *   - Image‑prompt text questions
 */
/* ==================================================================
   TEXT INPUT EXERCISES
   ================================================================== */
(function() {
    'use strict';
    /* ------------------- Common helpers for text input ------------------- */
    function degree4LessonTypeReadingTextInputSanityCheck(config) {
        if (!config || typeof config !== 'object') {
            console.error('degree4TextInput: configuration object is required.');
            return false;
        }
        if (!config.checkButtonId || !config.feedbackId) {
            console.error('degree4TextInput: checkButtonId and feedbackId are required.');
            return false;
        }
        if (!config.inputs || !Array.isArray(config.inputs) || config.inputs.length === 0) {
            console.error('degree4TextInput: inputs must be a non‑empty array.');
            return false;
        }
        for (const input of config.inputs) {
            if (!input.id || !input.correctAnswers || !Array.isArray(input.correctAnswers) || input.correctAnswers.length === 0) {
                console.error('degree4TextInput: each input must have an id and a non‑empty correctAnswers array (first element = default).');
                return false;
            }
        }
        return true;
    }
    function degree4LessonTypeReadingTextInputGetText(key, fallback) {
        if (typeof App !== 'undefined' && typeof App.getTranslation === 'function') {
            try {
                return App.getTranslation(key, localStorage.getItem('lang') || 'fr') || fallback;
            } catch (e) {
                return fallback;
            }
        }
        return fallback;
    }
    function degree4LessonTypeReadingTextInputMakeSounds(sounds) {
        return {
            correct: sounds?.correct ? new Audio(sounds.correct) : null,
            wrong: sounds?.wrong ? new Audio(sounds.wrong) : null,
            complete: sounds?.complete ? new Audio(sounds.complete) : null
        };
    }
    function degree4LessonTypeReadingTextInputPlaySound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    function degree4LessonTypeReadingTextInputBuildFeedback(score, total, details) {
        const T = {
            allCorrect: degree4LessonTypeReadingTextInputGetText('degree4_exercices_all_correct', '✅ Parfait ! Toutes les réponses sont correctes.'),
            partialCorrect: degree4LessonTypeReadingTextInputGetText('degree4_exercices_partial_correct', '⚠️ Vous avez {score}/{total}.'),
            noneCorrect: degree4LessonTypeReadingTextInputGetText('degree4_exercices_none_correct', '❌ Aucune bonne réponse.'),
            wrongWithAnswer: degree4LessonTypeReadingTextInputGetText('degree4_exercices_wrong_with_answer', 'La bonne réponse est : {answer}'),
            separator: degree4LessonTypeReadingTextInputGetText('degree4_exercices_separator', ' ')
        };
        let message = '';
        if (score === total) {
            message = T.allCorrect;
        } else if (score > 0) {
            message = T.partialCorrect.replace('{score}', score).replace('{total}', total);
            const wrong = details.filter(d => !d.correct);
            if (wrong.length) message += T.separator + wrong.map(d => T.wrongWithAnswer.replace('{answer}', d.defaultAnswer)).join(' | ');
        } else {
            message = T.noneCorrect;
            const wrong = details.filter(d => !d.correct);
            if (wrong.length) message += T.separator + wrong.map(d => T.wrongWithAnswer.replace('{answer}', d.defaultAnswer)).join(' | ');
        }
        return message;
    }
    function degree4LessonTypeReadingTextInputCheckValues(inputs) {
        let score = 0;
        const total = inputs.length;
        const details = [];
        inputs.forEach(inputCfg => {
            const el = document.getElementById(inputCfg.id);
            if (!el) {
                details.push({ id: inputCfg.id, correct: false, value: null, defaultAnswer: inputCfg.correctAnswers[0] });
                return;
            }
            const raw = el.value.trim().toLowerCase();
            const correct = inputCfg.correctAnswers.some(ans => {
                const a = String(ans).toLowerCase();
                return raw === a || raw.includes(a);
            });
            if (correct) score++;
            details.push({ id: inputCfg.id, correct, value: raw, defaultAnswer: inputCfg.correctAnswers[0] });
        });
        return { score, total, details };
    }
    /* ------------------- Plain text question processor ------------------- */
    function degree4LessonTypeReadingTextInputProcess(config) {
        if (!degree4LessonTypeReadingTextInputSanityCheck(config)) return false;
        const checkBtn = document.getElementById(config.checkButtonId);
        const feedbackEl = document.getElementById(config.feedbackId);
        if (!checkBtn || !feedbackEl) {
            console.error('degree4TextInput: button or feedback element not found.');
            return false;
        }
        const container = checkBtn.closest('.degree4-lessonType-reading-exercise');
        if (container) container.classList.add('degree4-lessonType-reading-text-input-container');
        const sounds = degree4LessonTypeReadingTextInputMakeSounds(config.sounds);
        checkBtn.addEventListener('click', function() {
            const { score, total, details } = degree4LessonTypeReadingTextInputCheckValues(config.inputs);
            const message = degree4LessonTypeReadingTextInputBuildFeedback(score, total, details);
            const feedbackClass = score === total ? 'correct' : 'wrong';
            if (score === total) degree4LessonTypeReadingTextInputPlaySound(sounds.complete || sounds.correct);
            else if (score > 0) degree4LessonTypeReadingTextInputPlaySound(sounds.correct || sounds.wrong);
            else degree4LessonTypeReadingTextInputPlaySound(sounds.wrong);
            feedbackEl.textContent = message;
            feedbackEl.className = 'degree4-lessonType-reading-feedback ' + feedbackClass;
            if (typeof config.onComplete === 'function') config.onComplete({ score, total, details });
        });
        return true;
    }
    /* ------------------- Image‑prompt text question processor ------------------- */
    function degree4LessonTypeReadingTextInputImageSanityCheck(config) {
        if (!config || typeof config !== 'object') {
            console.error('degree4TextInputImage: configuration object is required.');
            return false;
        }
        if (!config.containerId || !config.checkButtonId || !config.feedbackId) {
            console.error('degree4TextInputImage: containerId, checkButtonId and feedbackId are required.');
            return false;
        }
        if (!config.items || !Array.isArray(config.items) || config.items.length === 0) {
            console.error('degree4TextInputImage: items must be a non‑empty array.');
            return false;
        }
        for (const item of config.items) {
            if (!item.imageSrc || !item.inputId || !item.correctAnswers || !Array.isArray(item.correctAnswers) || item.correctAnswers.length === 0) {
                console.error('degree4TextInputImage: each item must have imageSrc, inputId and non‑empty correctAnswers array (first element = default).');
                return false;
            }
        }
        return true;
    }
    function degree4LessonTypeReadingTextInputImageProcess(config) {
        if (!degree4LessonTypeReadingTextInputImageSanityCheck(config)) return false;
        const container = document.getElementById(config.containerId);
        if (!container) {
            console.error('degree4TextInputImage: container element not found.');
            return false;
        }
        const checkBtn = document.getElementById(config.checkButtonId);
        const feedbackEl = document.getElementById(config.feedbackId);
        if (!checkBtn || !feedbackEl) return false;
        container.classList.add('degree4-lessonType-reading-text-input-image-container');
        config.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'degree4-lessonType-reading-text-input-image-item';
            const img = document.createElement('img');
            img.src = item.imageSrc;
            img.alt = 'Image';
            img.className = 'degree4-lessonType-reading-text-input-image-img';
            itemDiv.appendChild(img);
            const input = document.createElement('input');
            input.type = 'text';
            input.id = item.inputId;
            input.placeholder = 'Votre réponse';
            input.className = 'degree4-lessonType-reading-text-input-image-input';
            itemDiv.appendChild(input);
            container.appendChild(itemDiv);
        });
        const sounds = degree4LessonTypeReadingTextInputMakeSounds(config.sounds);
        checkBtn.addEventListener('click', function() {
            const { score, total, details } = degree4LessonTypeReadingTextInputCheckValues(
                config.items.map(item => ({ id: item.inputId, correctAnswers: item.correctAnswers }))
            );
            const message = degree4LessonTypeReadingTextInputBuildFeedback(score, total, details);
            const feedbackClass = score === total ? 'correct' : 'wrong';
            if (score === total) degree4LessonTypeReadingTextInputPlaySound(sounds.complete || sounds.correct);
            else if (score > 0) degree4LessonTypeReadingTextInputPlaySound(sounds.correct || sounds.wrong);
            else degree4LessonTypeReadingTextInputPlaySound(sounds.wrong);
            feedbackEl.textContent = message;
            feedbackEl.className = 'degree4-lessonType-reading-feedback ' + feedbackClass;
            if (typeof config.onComplete === 'function') config.onComplete({ score, total, details });
        });
        return true;
    }
    // Expose text input functions
    window.degree4LessonTypeReadingTextInputProcess = degree4LessonTypeReadingTextInputProcess;
    window.degree4LessonTypeReadingTextInputImageProcess = degree4LessonTypeReadingTextInputImageProcess;
})();
/* ==================================================================
   DROPDOWN EXERCISES
   ================================================================== */
(function() {
    'use strict';
    function degree4LessonTypeReadingDropdownSanityCheck(config) {
        if (!config || typeof config !== 'object') {
            console.error('degree4Dropdown: configuration object is required.');
            return false;
        }
        if (!config.checkButtonId || !config.feedbackId) {
            console.error('degree4Dropdown: checkButtonId and feedbackId are required.');
            return false;
        }
        if (!config.dropdowns || !Array.isArray(config.dropdowns) || config.dropdowns.length === 0) {
            console.error('degree4Dropdown: dropdowns must be a non‑empty array.');
            return false;
        }
        for (const dd of config.dropdowns) {
            if (!dd.id || !dd.correctValue) {
                console.error('degree4Dropdown: each dropdown must have an id and a correctValue.');
                return false;
            }
        }
        return true;
    }
    function degree4LessonTypeReadingDropdownGetText(key, fallback) {
        if (typeof App !== 'undefined' && typeof App.getTranslation === 'function') {
            try {
                return App.getTranslation(key, localStorage.getItem('lang') || 'fr') || fallback;
            } catch (e) {
                return fallback;
            }
        }
        return fallback;
    }
    function degree4LessonTypeReadingDropdownMakeSounds(sounds) {
        return {
            correct: sounds?.correct ? new Audio(sounds.correct) : null,
            wrong: sounds?.wrong ? new Audio(sounds.wrong) : null,
            complete: sounds?.complete ? new Audio(sounds.complete) : null
        };
    }
    function degree4LessonTypeReadingDropdownPlaySound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    function degree4LessonTypeReadingDropdownBuildFeedback(score, total, details) {
        const T = {
            allCorrect: degree4LessonTypeReadingDropdownGetText('degree4_exercices_all_correct', '✅ Parfait ! Toutes les réponses sont correctes.'),
            partialCorrect: degree4LessonTypeReadingDropdownGetText('degree4_exercices_partial_correct', '⚠️ Vous avez {score}/{total}.'),
            noneCorrect: degree4LessonTypeReadingDropdownGetText('degree4_exercices_none_correct', '❌ Aucune bonne réponse.'),
            wrongWithAnswer: degree4LessonTypeReadingDropdownGetText('degree4_exercices_wrong_with_answer', 'La bonne réponse est : {answer}'),
            separator: degree4LessonTypeReadingDropdownGetText('degree4_exercices_separator', ' ')
        };
        let message = '';
        if (score === total) {
            message = T.allCorrect;
        } else if (score > 0) {
            message = T.partialCorrect.replace('{score}', score).replace('{total}', total);
            const wrong = details.filter(d => !d.correct);
            if (wrong.length) message += T.separator + wrong.map(d => T.wrongWithAnswer.replace('{answer}', d.defaultAnswer)).join(' | ');
        } else {
            message = T.noneCorrect;
            const wrong = details.filter(d => !d.correct);
            if (wrong.length) message += T.separator + wrong.map(d => T.wrongWithAnswer.replace('{answer}', d.defaultAnswer)).join(' | ');
        }
        return message;
    }
    function degree4LessonTypeReadingDropdownProcess(config) {
        if (!degree4LessonTypeReadingDropdownSanityCheck(config)) return false;
        const checkBtn = document.getElementById(config.checkButtonId);
        const feedbackEl = document.getElementById(config.feedbackId);
        if (!checkBtn || !feedbackEl) {
            console.error('degree4Dropdown: button or feedback element not found.');
            return false;
        }
        const container = checkBtn.closest('.degree4-lessonType-reading-exercise');
        if (container) container.classList.add('degree4-lessonType-reading-dropdown-container');
        const sounds = degree4LessonTypeReadingDropdownMakeSounds(config.sounds);
        checkBtn.addEventListener('click', function() {
            let score = 0;
            const total = config.dropdowns.length;
            const details = [];
            config.dropdowns.forEach(ddCfg => {
                const el = document.getElementById(ddCfg.id);
                if (!el) {
                    details.push({ id: ddCfg.id, correct: false, value: null, defaultAnswer: ddCfg.correctValue });
                    return;
                }
                const selected = el.value;
                const correct = selected === ddCfg.correctValue;
                if (correct) score++;
                details.push({ id: ddCfg.id, correct, value: selected, defaultAnswer: ddCfg.correctValue });
            });
            const message = degree4LessonTypeReadingDropdownBuildFeedback(score, total, details);
            const feedbackClass = score === total ? 'correct' : 'wrong';
            if (score === total) degree4LessonTypeReadingDropdownPlaySound(sounds.complete || sounds.correct);
            else if (score > 0) degree4LessonTypeReadingDropdownPlaySound(sounds.correct || sounds.wrong);
            else degree4LessonTypeReadingDropdownPlaySound(sounds.wrong);
            feedbackEl.textContent = message;
            feedbackEl.className = 'degree4-lessonType-reading-feedback ' + feedbackClass;
            if (typeof config.onComplete === 'function') config.onComplete({ score, total, details });
        });
        return true;
    }
    function degree4LessonTypeReadingDropdownInjectEmoji(container) {
        const selects = container ? container.querySelectorAll('select') : document.querySelectorAll('select');
        selects.forEach(sel => {
            if (sel.parentElement.querySelector(':scope > .degree4-lessonType-reading-dropdown-emoji')) return;
            const emoji = document.createElement('span');
            emoji.className = 'degree4-lessonType-reading-dropdown-emoji';
            emoji.textContent = '🔽';
            emoji.setAttribute('aria-hidden', 'true');
            sel.insertAdjacentElement('afterend', emoji);
            sel.parentElement.classList.add('degree4-lessonType-reading-dropdown-select-wrapper');
        });
    }
    function degree4LessonTypeReadingDropdownGetPrintableContent(container) {
        const clone = container.cloneNode(true);
        clone.querySelectorAll('select').forEach(select => {
            const selectedValue = select.value;
            const options = Array.from(select.options).map(opt => {
                let text = opt.textContent.trim();
                if (opt.value === selectedValue) text += ' ✔';
                return text;
            });
            const div = document.createElement('div');
            div.className = 'degree4-lessonType-reading-dropdown-print-options';
            const strong = document.createElement('strong');
            strong.textContent = 'Options: ';
            div.appendChild(strong);
            const span = document.createElement('span');
            span.textContent = options.join(' ; ') + '.';
            div.appendChild(span);
            select.replaceWith(div);
        });
        return clone.innerHTML;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => degree4LessonTypeReadingDropdownInjectEmoji());
    } else {
        degree4LessonTypeReadingDropdownInjectEmoji();
    }
    window.degree4LessonTypeReadingDropdownProcess = degree4LessonTypeReadingDropdownProcess;
    window.degree4LessonTypeReadingDropdownInjectEmoji = degree4LessonTypeReadingDropdownInjectEmoji;
    window.degree4LessonTypeReadingDropdownGetPrintableContent = degree4LessonTypeReadingDropdownGetPrintableContent;
})();
/* ==================================================================
   MATCHING EXERCISES
   ================================================================== */
(function() {
    'use strict';
    function degree4LessonTypeReadingMatchingSanityCheck(config) {
        if (!config || typeof config !== 'object') {
            console.error('degree4Matching: configuration object is required.');
            return false;
        }
        if (!config.containerId || !config.checkButtonId || !config.feedbackId) {
            console.error('degree4Matching: containerId, checkButtonId and feedbackId are required.');
            return false;
        }
        if (!config.leftItems || !Array.isArray(config.leftItems) || config.leftItems.length === 0) {
            console.error('degree4Matching: leftItems must be a non‑empty array.');
            return false;
        }
        if (!config.rightItems || !Array.isArray(config.rightItems) || config.rightItems.length === 0) {
            console.error('degree4Matching: rightItems must be a non‑empty array.');
            return false;
        }
        if (!config.correctMatches || typeof config.correctMatches !== 'object') {
            console.error('degree4Matching: correctMatches must be an object mapping leftId to rightId.');
            return false;
        }
        return true;
    }
    function degree4LessonTypeReadingMatchingGetText(key, fallback) {
        if (typeof App !== 'undefined' && typeof App.getTranslation === 'function') {
            try {
                return App.getTranslation(key, localStorage.getItem('lang') || 'fr') || fallback;
            } catch (e) {
                return fallback;
            }
        }
        return fallback;
    }
    function degree4LessonTypeReadingMatchingMakeSounds(sounds) {
        return {
            correct: sounds?.correct ? new Audio(sounds.correct) : null,
            wrong: sounds?.wrong ? new Audio(sounds.wrong) : null,
            complete: sounds?.complete ? new Audio(sounds.complete) : null
        };
    }
    function degree4LessonTypeReadingMatchingPlaySound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    function degree4LessonTypeReadingMatchingBuildFeedback(score, total, details) {
        const T = {
            allCorrect: degree4LessonTypeReadingMatchingGetText('degree4_exercices_all_correct', '✅ Parfait ! Toutes les réponses sont correctes.'),
            partialCorrect: degree4LessonTypeReadingMatchingGetText('degree4_exercices_partial_correct', '⚠️ Vous avez {score}/{total}.'),
            noneCorrect: degree4LessonTypeReadingMatchingGetText('degree4_exercices_none_correct', '❌ Aucune bonne réponse.'),
            wrongWithAnswer: degree4LessonTypeReadingMatchingGetText('degree4_exercices_wrong_with_answer', 'La bonne réponse est : {answer}'),
            separator: degree4LessonTypeReadingMatchingGetText('degree4_exercices_separator', ' ')
        };
        let message = '';
        if (score === total) {
            message = T.allCorrect;
        } else if (score > 0) {
            message = T.partialCorrect.replace('{score}', score).replace('{total}', total);
            const wrong = details.filter(d => !d.correct);
            if (wrong.length) message += T.separator + wrong.map(d => T.wrongWithAnswer.replace('{answer}', d.defaultAnswer)).join(' | ');
        } else {
            message = T.noneCorrect;
            const wrong = details.filter(d => !d.correct);
            if (wrong.length) message += T.separator + wrong.map(d => T.wrongWithAnswer.replace('{answer}', d.defaultAnswer)).join(' | ');
        }
        return message;
    }
    function degree4LessonTypeReadingMatchingProcess(config) {
        if (!degree4LessonTypeReadingMatchingSanityCheck(config)) return false;
        const container = document.getElementById(config.containerId);
        if (!container) {
            console.error('degree4Matching: container element not found.');
            return false;
        }
        const checkBtn = document.getElementById(config.checkButtonId);
        const feedbackEl = document.getElementById(config.feedbackId);
        if (!checkBtn || !feedbackEl) return false;
        container.classList.add('degree4-lessonType-reading-matching-container');
        const leftCol = document.createElement('div');
        leftCol.className = 'degree4-lessonType-reading-matching-col';
        const rightCol = document.createElement('div');
        rightCol.className = 'degree4-lessonType-reading-matching-col';
        config.leftItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'degree4-lessonType-reading-matching-item degree4-lessonType-reading-matching-left-item';
            el.dataset.id = item.id;
            el.textContent = item.label;
            leftCol.appendChild(el);
        });
        config.rightItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'degree4-lessonType-reading-matching-item degree4-lessonType-reading-matching-right-item';
            el.dataset.id = item.id;
            el.textContent = item.label;
            rightCol.appendChild(el);
        });
        const main = document.createElement('div');
        main.className = 'degree4-lessonType-reading-matching-main';
        main.appendChild(leftCol);
        main.appendChild(rightCol);
        container.appendChild(main);
        let selectedLeft = null;
        let selectedRight = null;
        const matches = {};
        function clearSelection() {
            container.querySelectorAll('.degree4-lessonType-reading-matching-item.selected').forEach(el => el.classList.remove('selected'));
        }
        function updateMatchedVisuals() {
            container.querySelectorAll('.degree4-lessonType-reading-matching-item.matched').forEach(el => el.classList.remove('matched'));
            for (const leftId in matches) {
                const rightId = matches[leftId];
                const leftEl = container.querySelector(`.degree4-lessonType-reading-matching-left-item[data-id="${leftId}"]`);
                const rightEl = container.querySelector(`.degree4-lessonType-reading-matching-right-item[data-id="${rightId}"]`);
                if (leftEl) leftEl.classList.add('matched');
                if (rightEl) rightEl.classList.add('matched');
            }
        }
        container.addEventListener('click', (e) => {
            const item = e.target.closest('.degree4-lessonType-reading-matching-item');
            if (!item) return;
            if (item.classList.contains('degree4-lessonType-reading-matching-left-item')) {
                clearSelection();
                selectedLeft = item.dataset.id;
                item.classList.add('selected');
            } else {
                clearSelection();
                selectedRight = item.dataset.id;
                item.classList.add('selected');
            }
            if (selectedLeft && selectedRight) {
                matches[selectedLeft] = selectedRight;
                selectedLeft = null;
                selectedRight = null;
                clearSelection();
                updateMatchedVisuals();
            }
        });
        const sounds = degree4LessonTypeReadingMatchingMakeSounds(config.sounds);
        checkBtn.addEventListener('click', function() {
            let score = 0;
            const total = Object.keys(config.correctMatches).length;
            const details = [];
            for (const leftId in config.correctMatches) {
                const correctRight = config.correctMatches[leftId];
                const userRight = matches[leftId];
                const isCorrect = userRight === correctRight;
                if (isCorrect) score++;
                const rightItem = config.rightItems.find(r => r.id === correctRight);
                const correctLabel = rightItem ? rightItem.label : correctRight;
                details.push({
                    leftId,
                    correct: isCorrect,
                    defaultAnswer: correctLabel
                });
            }
            const message = degree4LessonTypeReadingMatchingBuildFeedback(score, total, details);
            const feedbackClass = score === total ? 'correct' : 'wrong';
            if (score === total) degree4LessonTypeReadingMatchingPlaySound(sounds.complete || sounds.correct);
            else if (score > 0) degree4LessonTypeReadingMatchingPlaySound(sounds.correct || sounds.wrong);
            else degree4LessonTypeReadingMatchingPlaySound(sounds.wrong);
            feedbackEl.textContent = message;
            feedbackEl.className = 'degree4-lessonType-reading-feedback ' + feedbackClass;
            if (typeof config.onComplete === 'function') config.onComplete({ score, total, details });
        });
        return true;
    }
    window.degree4LessonTypeReadingMatchingProcess = degree4LessonTypeReadingMatchingProcess;
})();