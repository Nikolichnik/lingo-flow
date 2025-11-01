function qs(sel) {
    return document.querySelector(sel);
}

function qsa(sel) {
    return [...document.querySelectorAll(sel)];
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>\"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function starHtml(v, deckIndex) {
    const stars = Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        return `<span class="star ${n <= v ? 'on' : ''}" data-v="${n}">★</span>`;
    });
    stars.unshift(`<span class="star" data-v="0">✰</span>`);
    return `<span class="stars" data-v="${v}" data-i="${deckIndex}">${stars.join('')}</span>`;
}

function updateRangeFill(el) {
    const min = Number(el.min || 0);
    const max = Number(el.max || 100);
    const val = Number(el.value || 0);
    const pct = ((val - min) * 100) / (max - min);
    el.style.setProperty('--fill', `${pct}%`);
}

function clampFamRange(minSel, maxSel, minBadge, maxBadge) {
    let min = Number(minSel.value || 0);
    let max = Number(maxSel.value || 5);

    if (min > max) {
        if (document.activeElement === minSel) { max = min; maxSel.value = String(max); }
        else { min = max; minSel.value = String(min); }
    }

    if (minBadge) minBadge.textContent = String(min);
    if (maxBadge) maxBadge.textContent = String(max);

    const wrap = document.querySelector('.double-slider .range-wrap');
    const lo = Number(minSel.min || 0);
    const hi = Number(minSel.max || 5);
    const minPct = ((min - lo) * 100) / (hi - lo);
    const maxPct = ((max - lo) * 100) / (hi - lo);
    if (wrap) {
        wrap.style.setProperty('--min-pct', `${minPct}%`);
        wrap.style.setProperty('--max-pct', `${maxPct}%`);
    }
}

function initThemeToggle() {
    const btn = qs('#themeToggleBtn');
    if (!btn) return;
    const key = 'bf27:theme';
    const root = document.documentElement;
    const apply = (mode) => {
        root.setAttribute('data-theme', mode);
        btn.textContent = (mode === 'light') ? '☀️ Light' : '🌙 Dark';
        btn.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
    };
    const stored = localStorage.getItem(key) || 'light';
    apply(stored);

    btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        localStorage.setItem(key, next);
        apply(next);
    });
}

function initHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if (!helpModal) return;
    const helpContent = document.getElementById('help-content');
    const helpTemplate = document.getElementById('help-template');
    const helpBtn = document.getElementById('helpBtn');

    function openHelp() {
        if (!helpTemplate) return;
        const fragment = helpTemplate.content.cloneNode(true);
        helpContent.replaceChildren(fragment);
        helpModal.setAttribute('aria-hidden', 'false');
        helpModal.querySelector('.bf-help-close')?.focus();
    }

    function closeHelp() {
        helpModal.setAttribute('aria-hidden', 'true');
        while (helpContent.firstChild) helpContent.removeChild(helpContent.firstChild);
        helpBtn?.focus();
    }

    helpModal.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-help-close')) closeHelp();
    });

    document.addEventListener('keydown', (e) => {
        if (helpModal.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') closeHelp();
    });

    helpBtn?.addEventListener('click', openHelp);
}

function bootstrap({ deckStore, csv, initializeSpeech }) {
    const table = qs('#deckTbl');
    const tbody = table?.querySelector('tbody');
    const deckInfo = qs('#deckInfo');
    const exportBtn = qs('#exportBtn');
    const minSel = qs('#minFamSel');
    const maxSel = qs('#maxFamSel');
    const rate = qs('#rate');
    const rateVal = qs('#rateVal');
    const vol = qs('#vol');
    const volVal = qs('#volVal');
    const voiceSel = qs('#voiceSel');
    const speakWordsChk = qs('#speakWordsChk');
    const speakExamplesChk = qs('#speakExamplesChk');
    const speakTranslationsChk = qs('#speakTranslationsChk');
    const shuffleChk = qs('#shuffleChk');
    const loopChk = qs('#loopChk');
    const playBtn = qs('#playBtn');
    const stopBtn = qs('#stopBtn');
    const fileInput = qs('#fileInput');
    const minFamVal = qs('#minFamVal');
    const maxFamVal = qs('#maxFamVal');
    const sortButtons = qsa('#deckTbl thead .sort-btn');
    const tableContainer = qs('.table-container');

    if (!table || !tbody || !exportBtn || !fileInput || !deckStore || !minSel || !maxSel) return;

    const speechService = initializeSpeech({ voiceSelect: voiceSel, rateInput: rate, volumeInput: vol });

    let playing = false;
    let autoQueue = [];
    let sortState = { column: 'ordinal', direction: 'asc' };

    function getFamValue(row) {
        if (!row) return 0;
        return deckStore.getFam(row._id, row.familiarity);
    }

    function applySort(indices, deck) {
        if (!Array.isArray(indices)) return [];
        const dir = sortState.direction === 'asc' ? 1 : -1;
        const sorted = [...indices];

        if (sortState.column === 'familiarity') {
            sorted.sort((a, b) => {
                const rowA = deck[a];
                const rowB = deck[b];
                const famA = getFamValue(rowA);
                const famB = getFamValue(rowB);
                if (famA === famB) return (a - b) * dir;
                return (famA - famB) * dir;
            });
        } else {
            sorted.sort((a, b) => (a - b) * dir);
        }

        return sorted;
    }

    function updateSortIndicators() {
        sortButtons.forEach(btn => {
            const isActive = btn.dataset.sort === sortState.column;
            btn.dataset.dir = isActive ? sortState.direction : '';
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            const th = btn.closest('th');
            if (th) th.setAttribute('aria-sort', isActive ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none');
        });
    }

    function renderTable() {
        if (!tbody) return;
        tbody.innerHTML = '';

        const indices = deckStore.filterByFamiliarity(minSel.value, maxSel.value);
        const deck = deckStore.getDeck();

        const sortedIndices = applySort(indices, deck);
        if (deckStore.setFilteredOrder) deckStore.setFilteredOrder(sortedIndices);

        sortedIndices.forEach((di) => {
            const r = deck[di];
            const tr = document.createElement('tr');
            tr.dataset.i = String(di);
            const ordinal = r?._id ?? di + 1;
            const famValue = getFamValue(r);
            tr.innerHTML = `
      <td class="muted" data-col="ordinal">${ordinal}</td>
      <td class="speak" data-i="${di}" data-field="word">${escapeHtml(r.word)}</td>
      <td class="speak" data-i="${di}" data-field="example">${escapeHtml(r.example)}</td>
      <td class="muted">${escapeHtml(r.translation)}</td>
      <td class="muted">${escapeHtml(r.example_translation)}</td>
      <td data-col="familiarity">${starHtml(famValue, di)}</td>
    `;
            tbody.appendChild(tr);
        });

        table.classList.toggle('hidden', sortedIndices.length === 0);
        exportBtn.disabled = deck.length === 0;

        updateSortIndicators();

        qsa('.speak').forEach(el => {
            el.addEventListener('click', () => {
                const i = Number(el.dataset.i);
                const field = el.dataset.field;
                handleSpeakCell(i, field);
            });
        });

        qsa('.stars').forEach(st => {
            st.addEventListener('click', (e) => {
                const i = Number(st.dataset.i);
                const v = Number(e.target.dataset.v ?? st.dataset.v);
                if (Number.isInteger(v)) {
                    const row = deckStore.getRow(i);
                    deckStore.setFam(row._id, v);
                    renderTable();
                }
            });
        });
    }

    function clearRowHighlights(i) {
        if (i < 0) return;
        const rowEl = tbody.querySelector(`tr[data-i="${i}"]`);
        rowEl?.classList.remove('playing');
    }

    function scrollRowIntoView(rowEl) {
        if (!rowEl || !tableContainer) return;
        const containerRect = tableContainer.getBoundingClientRect();
        const rowRect = rowEl.getBoundingClientRect();
        const offset = rowRect.top - containerRect.top;
        const target = tableContainer.scrollTop + offset - (tableContainer.clientHeight / 2) + (rowEl.offsetHeight / 2);
        tableContainer.scrollTo({ top: target });
    }

    async function handleSpeakCell(i, field) {
        const row = deckStore.getRow(i);
        if (!row) return;
        const rowEl = tbody.querySelector(`tr[data-i="${i}"]`);
        const cellEl = rowEl?.querySelector(field === 'word' ? 'td:nth-child(2)' : 'td:nth-child(3)');
        cellEl?.classList.add('speaking');
        try {
            await speechService.speakRow(row, field, { includeTranslations: speakTranslationsChk?.checked });
        } finally {
            cellEl?.classList.remove('speaking');
        }
    }

    async function runQueue() {
        playing = true;
        playBtn.disabled = true;
        stopBtn.disabled = false;

        autoQueue = deckStore.buildQueue({
            includeWords: speakWordsChk?.checked,
            includeExamples: speakExamplesChk?.checked,
            shuffle: shuffleChk?.checked
        });

        if (autoQueue.length === 0) {
            playing = false;
            playBtn.disabled = false;
            stopBtn.disabled = true;
            return;
        }

        let lastRow = -1;

        do {
            for (const [i, field] of autoQueue) {
                if (!playing) break;

                if (lastRow !== i) {
                    clearRowHighlights(lastRow);
                    lastRow = i;
                }

                const rowEl = tbody.querySelector(`tr[data-i="${i}"]`);
                rowEl?.classList.add('playing');
                scrollRowIntoView(rowEl);
                await handleSpeakCell(i, field);

                const pauseValue = 600 / (Number(rate?.value) || 1);
                await new Promise(res => setTimeout(res, pauseValue));

                const row = deckStore.getRow(i);
                if (row) deckStore.adjustFamiliarity(row._id, 0.1);
            }
        } while (playing && loopChk?.checked);

        clearRowHighlights(lastRow);
        playing = false;
        playBtn.disabled = false;
        stopBtn.disabled = true;
        renderTable();
    }

    function stopQueue() {
        playing = false;
        speechService.cancel();
        stopBtn.disabled = true;
        playBtn.disabled = false;
    }

    fileInput.addEventListener('change', async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;

        const deckKey = (f.name || 'deck').replace(/\.[^/.]+$/, '');
        const text = await f.text();
        const rows = csv.parseCSV(text);

        let deck;
        try {
            deck = deckStore.buildDeckFromRows(rows);
        } catch (err) {
            alert(err.message || 'Failed to parse CSV');
            return;
        }

        deckStore.setDeck(deck, deckKey);
        if (deckInfo) {
            const summary = `${f.name} • ${deck.length} rows`;
            deckInfo.textContent = summary;
            deckInfo.title = summary;
            deckInfo.classList.remove('placeholder');
        }

        sortState = { column: 'ordinal', direction: 'asc' };
        minSel.value = '0';
        maxSel.value = '5';
        clampFamRange(minSel, maxSel, minFamVal, maxFamVal);
        renderTable();
    });

    qs('#applyFilterBtn')?.addEventListener('click', renderTable);

    exportBtn.addEventListener('click', () => {
        if (deckStore.getDeck().length === 0) return;
        csv.triggerDeckDownload(deckStore.getDeck(), deckStore.getDeckKey(), deckStore.getFam);
    });

    playBtn?.addEventListener('click', () => runQueue());
    stopBtn?.addEventListener('click', () => stopQueue());

    rate?.addEventListener('input', () => {
        if (rateVal) rateVal.textContent = `${Number(rate.value).toFixed(1)}×`;
        updateRangeFill(rate);
    });

    vol?.addEventListener('input', () => {
        if (volVal) volVal.textContent = `${Math.round(Number(vol.value) * 100)}%`;
        updateRangeFill(vol);
    });

    [minSel, maxSel].forEach(el => {
        el?.addEventListener('input', () => clampFamRange(minSel, maxSel, minFamVal, maxFamVal));
    });

    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const column = btn.dataset.sort;
            if (!column) return;
            if (sortState.column === column) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState = { column, direction: 'asc' };
            }
            renderTable();
        });
    });

    updateSortIndicators();

    initThemeToggle();
    initHelpModal();

    if (rateVal) rateVal.textContent = `${Number(rate?.value || 1).toFixed(1)}×`;
    if (volVal) volVal.textContent = `${Math.round(Number(vol?.value || 1) * 100)}%`;
    clampFamRange(minSel, maxSel, minFamVal, maxFamVal);

    const onReady = () => {
        if (rate) updateRangeFill(rate);
        if (vol) updateRangeFill(vol);
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', onReady, { once: true });
    } else {
        onReady();
    }
}

const uiModule = { bootstrap };

if (typeof window !== 'undefined') {
    window.LingoFlow = window.LingoFlow || {};
    window.LingoFlow.ui = uiModule;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = uiModule;
}
