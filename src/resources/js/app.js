/* Externalized app logic (kept from your working version) + theme toggle */

/* ========= Tiny CSV parser ========= */
function parseCSV(text) {
    const rows = [];
    let cur = '', row = [], i = 0, inQuotes = false;

    while (i < text.length) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { cur += '"'; i++; }
                else { inQuotes = false; }
            } else { cur += c; }
        } else {
            if (c === '"') inQuotes = true;
            else if (c === '|') { row.push(cur); cur = ''; }
            else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
            else if (c === '\r') { /* ignore */ }
            else { cur += c; }
        }
        i++;
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    if (rows.length && rows[0].length) rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');

    return rows;
}

/* ========= Utilities / DOM ========= */
const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];

const table = qs('#deckTbl');
const tbody = table.querySelector('tbody');
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
const helpModal   = document.getElementById('help-modal');
const helpContent = document.getElementById('help-content');
const helpTemplate = document.getElementById('help-template');

/* ========= Defaults ========= */
const DEFAULTS = {
    rate: 1.0,
    volume: 1.0,
    voiceLocaleHint: 'de-DE',
    voiceNameHint: 'Anna',
};
 
let deck = [];
let filteredIdx = [];
let autoQueue = [];
let playing = false;
let deckKey = 'default';

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
  const helpBtn = document.getElementById('helpBtn');
  helpBtn?.focus();
}

function updateRangeFill(el) {
    const min = Number(el.min || 0);
    const max = Number(el.max || 100);
    const val = Number(el.value || 0);
    const pct = ((val - min) * 100) / (max - min);
    el.style.setProperty('--fill', `${pct}%`);
}

function clampFamRange(changedEl) {
    // Keep min <= max and update visuals
    let min = Number(minSel.value || 0);
    let max = Number(maxSel.value || 5);

    if (min > max) {
        if (changedEl === minSel) { max = min; maxSel.value = String(max); }
        else { min = max; minSel.value = String(min); }
    }

    // Update badges
    if (minFamVal) minFamVal.textContent = String(min);
    if (maxFamVal) maxFamVal.textContent = String(max);

    // Update fill percentage CSS vars
    const wrap = document.querySelector('.double-slider .range-wrap');
    const lo = Number(minSel.min || 0), hi = Number(minSel.max || 5);
    const minPct = ((min - lo) * 100) / (hi - lo);
    const maxPct = ((max - lo) * 100) / (hi - lo);
    if (wrap) {
        wrap.style.setProperty('--min-pct', `${minPct}%`);
        wrap.style.setProperty('--max-pct', `${maxPct}%`);
    }
}

function famKey(id) {
    return `bf27:fam:${deckKey}:${id}`;
}

function getFam(id, fallback) {
    const v = localStorage.getItem(famKey(id));

    return v == null ? (Number(fallback) || 0) : Number(v);
}

function setFam(id, v) {
    localStorage.setItem(famKey(id), String(v));
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function starHtml(v, deckIndex) {
    const stars = Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;

        return `<span class="star ${n <= v ? 'on' : ''}" data-v="${n}">★</span>`;
    });

    // Add 0-star control at the start
    stars.unshift(`<span class="star" data-v="0">✰</span>`);

    return `<span class="stars" data-v="${v}" data-i="${deckIndex}">${stars.join('')}</span>`;
}

function populateTable() {
    tbody.innerHTML = '';
    const lo = Number(minSel.value), hi = Number(maxSel.value);
    const lo2 = Math.min(lo, hi), hi2 = Math.max(lo, hi);

    filteredIdx = deck.map((_, i) => i).filter(i => {
        const f = getFam(deck[i]._id, deck[i].familiarity);

        return f >= lo2 && f <= hi2;
    });

    filteredIdx.forEach((di, ix) => {
        const r = deck[di];
        const tr = document.createElement('tr');
        tr.dataset.i = String(di);
        tr.innerHTML = `
      <td class="muted">${ix + 1}</td>
      <td class="speak" data-i="${di}" data-field="word">${escapeHtml(r.word)}</td>
      <td class="speak" data-i="${di}" data-field="example">${escapeHtml(r.example)}</td>
      <td class="muted">${escapeHtml(r.translation)}</td>
      <td class="muted">${escapeHtml(r.example_translation)}</td>
      <td>${starHtml(getFam(r._id, r.familiarity), di)}</td>
    `;
        tbody.appendChild(tr);
    });

    table.classList.toggle('hidden', filteredIdx.length === 0);
    exportBtn.disabled = deck.length === 0;

    qsa('.speak').forEach(el => {
        el.addEventListener('click', () => {
            const i = Number(el.dataset.i);
            const field = el.dataset.field;
            speakRow(i, field);
        });
    });

    qsa('.stars').forEach(st => {
        st.addEventListener('click', (e) => {
            const i = Number(st.dataset.i);
            const v = Number(e.target.dataset.v ?? st.dataset.v);

            if (Number.isInteger(v)) {
                setFam(deck[i]._id, v);
                populateTable();
            }
        });
    });
}

/* ========= Speech (Web Speech API) ========= */
let voices = [];

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    voiceSel.innerHTML = voices
        .map((v, i) => `<option value="${i}" data-lang="${v.lang}">${v.name} (${v.lang})</option>`)
        .join('');
    pickDefaultVoice();
}

function pickDefaultVoice() {
    if (!voiceSel || !voiceSel.options.length) return;

    let indexByName = -1;
    let indexByLocale = -1;

    [...voiceSel.options].forEach((opt, i) => {
        const text = opt.textContent || '';
        const locale = (opt.getAttribute('data-lang') || '').toLowerCase();
        if (text.includes(DEFAULTS.voiceNameHint)) indexByName = i;
        if (locale.startsWith(DEFAULTS.voiceLocaleHint.toLowerCase())) indexByLocale = i;
    });

    const useIndex = indexByName >= 0 ? indexByName :
        indexByLocale >= 0 ? indexByLocale : 0;

    voiceSel.selectedIndex = Math.max(0, useIndex);
}

if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
} else {
    alert('Your browser does not support Speech Synthesis (Web Speech API). Try Chrome/Edge/Safari.');
}

function speak(text) {
    if (!text || !text.trim()) return Promise.resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = Number(rate.value);
    u.volume = Number(vol.value);
    const v = voices[voiceSel.value | 0];
    if (v) u.voice = v;
    return new Promise(res => {
        u.onend = res; u.onerror = res;
        window.speechSynthesis.speak(u);
    });
}

async function speakRow(i, field) {
    const r = deck[i];
    const rowEl = tbody.querySelector(`tr[data-i="${i}"]`);
    const cellEl = rowEl?.querySelector(field === 'word' ? 'td:nth-child(2)' : 'td:nth-child(3)');

    // rowEl?.classList.add('playing');
    cellEl?.classList.add('speaking');

    try {
        const seq = [];

        if (field === 'word') seq.push(r.word);
        if (field === 'example') seq.push(r.example);

        if (speakTranslationsChk.checked) {
            if (field === 'word' && r.translation) seq.push(r.translation);
            if (field === 'example' && r.example_translation) seq.push(r.example_translation);
        }

        for (const t of seq) await speak(t);
    } finally {
        cellEl?.classList.remove('speaking');
        // rowEl?.classList.remove('playing');
    }
}

/* ========= Auto Play ========= */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildQueue() {
    const cols = [];

    if (speakWordsChk.checked) cols.push('word');
    if (speakExamplesChk.checked) cols.push('example');

    const idx = [...filteredIdx];

    if (shuffleChk.checked) shuffle(idx);

    const q = [];
    for (const i of idx) for (const c of cols) q.push([i, c]);

    return q;
}

function clearRowHighlights(i) {
    const rowEl = tbody.querySelector(`tr[data-i="${i}"]`);

    rowEl?.classList.remove('playing');
}

async function runQueue() {
    playing = true;
    playBtn.disabled = true;
    stopBtn.disabled = false;

    autoQueue = buildQueue();

    if (autoQueue.length === 0) {
        playing = false; playBtn.disabled = false; stopBtn.disabled = true;
        return;
    }

    let last_row_i = -1;

    do {
        for (const [i, c] of autoQueue) {
            if (!playing) break;

            if (last_row_i !== i) {
                clearRowHighlights(last_row_i);

                last_row_i = i;
            }

            const rowEl = tbody.querySelector(`tr[data-i="${i}"]`);
            rowEl?.classList.add('playing');

            await speakRow(i, c);

            // Add a small pause between items
            const pauseValue = 600 / (Number(rate.value) || 1);
            await new Promise(res => setTimeout(res, pauseValue));

            // Introduce slight familiarity increase on each play (max 5)
            const id = deck[i]._id;
            const cur = getFam(id, deck[i].familiarity);

            if (cur < 5) setFam(id, cur + 0.1);
        }
    } while (playing && loopChk.checked);

    clearRowHighlights(last_row_i);

    playing = false;
    playBtn.disabled = false;
    stopBtn.disabled = true;
}

playBtn.addEventListener('click', () => runQueue());
stopBtn.addEventListener('click', () => { playing = false; window.speechSynthesis.cancel(); });

rate.addEventListener('input', () => {
    rateVal.textContent = `${Number(rate.value).toFixed(1)}×`;
    updateRangeFill(rate);
});
vol.addEventListener('input', () => {
    volVal.textContent = `${Math.round(Number(vol.value) * 100)}%`;
    updateRangeFill(vol);
});

// Keep the double slider in sync while dragging
[minSel, maxSel].forEach(el => {
    el?.addEventListener('input', () => clampFamRange(el));
});

/* ========= Load / Export ========= */
fileInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    deckKey = (f.name || 'deck').replace(/\.[^/.]+$/, '');
    const text = await f.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
        alert('Empty CSV');

        return;
    }

    const header = rows[0].map(h => (h || '').trim().toLowerCase());
    const wordIdx = header.indexOf('word') >= 0 ? header.indexOf('word') : header.indexOf('words');
    const exampleIdx = header.indexOf('example');
    const translationIdx = header.indexOf('translation');
    const exTransIdx = header.indexOf('example_translation');
    const famIdx = header.indexOf('familiarity');

    if (wordIdx < 0 || exampleIdx < 0) {
        alert('CSV must include columns: word, example. Optional: translation, example_translation, familiarity.');

        return;
    }

    deck = rows
        .slice(1)
        .filter(r => r.some(c => (c || '').trim().length))
        .map((r, i) => ({
            _id: i + 1,
            word: r[wordIdx] || '',
            example: r[exampleIdx] || '',
            translation: translationIdx >= 0 ? (r[translationIdx] || '') : '',
            example_translation: exTransIdx >= 0 ? (r[exTransIdx] || '') : '',
            familiarity: famIdx >= 0 ? Number(r[famIdx] || 0) : 0
        }));

    deckInfo.textContent = `${f.name} • ${deck.length} rows`;
    minSel.value = '0'; maxSel.value = '5';
    clampFamRange(); // sync double slider fill and labels

    populateTable();
});

qs('#applyFilterBtn').addEventListener('click', populateTable);

exportBtn.addEventListener('click', () => {
    if (deck.length === 0) return;
    const header = ['word', 'example', 'translation', 'example_translation', 'familiarity'];
    const rows = deck.map(r => [
        r.word, r.example, r.translation, r.example_translation,
        Math.round(getFam(r._id, r.familiarity))
    ]);
    const csv = [header, ...rows]
        .map(r => r.map(cell => {
            if (cell == null) cell = '';
            const s = String(cell);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${deckKey}-with-familiarity.csv`;
    document.body.appendChild(a);
    a.click(); a.remove();
});

/* ========= Theme toggle ========= */
(function themeInit() {
    const btn = qs('#themeToggleBtn');
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
})();


/* ========= Help ========= */
helpModal.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-help-close')) closeHelp();
});

// ESC to close
document.addEventListener('keydown', (e) => {
  if (helpModal.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') closeHelp();
});

const helpBtn = document.getElementById('helpBtn');

if (helpBtn) helpBtn.addEventListener('click', openHelp);

/* ========= Initial labels ========= */
rateVal.textContent = `${Number(rate.value).toFixed(1)}×`;
volVal.textContent = `${Math.round(Number(vol.value) * 100)}%`;
clampFamRange();

window.addEventListener('DOMContentLoaded', () => {
    updateRangeFill(rate);
    updateRangeFill(vol);
});