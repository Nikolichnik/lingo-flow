const qs = (s) => document.querySelector(s);

export const elements = {
    table: qs('#deckTbl'),
    tbody: qs('#deckTbl tbody'),
    deckInfo: qs('#deckInfo'),
    exportBtn: qs('#exportBtn'),
    minSel: qs('#minFamSel'),
    maxSel: qs('#maxFamSel'),
    rate: qs('#rate'),
    rateVal: qs('#rateVal'),
    vol: qs('#vol'),
    volVal: qs('#volVal'),
    voiceSel: qs('#voiceSel'),
    speakWordsChk: qs('#speakWordsChk'),
    speakExamplesChk: qs('#speakExamplesChk'),
    speakTranslationsChk: qs('#speakTranslationsChk'),
    shuffleChk: qs('#shuffleChk'),
    loopChk: qs('#loopChk'),
    playBtn: qs('#playBtn'),
    stopBtn: qs('#stopBtn'),
    fileInput: qs('#fileInput'),
    minFamVal: qs('#minFamVal'),
    maxFamVal: qs('#maxFamVal'),
    helpModal: document.getElementById('help-modal'),
    helpContent: document.getElementById('help-content'),
    helpBtn: document.getElementById('helpBtn'),
    themeToggleBtn: qs('#themeToggleBtn'),
};

const HELP_HTML = `
  <article>
    <h1 id="help-title">LingoFlow • Help</h1>
    <p>A lightweight <strong>CSV → audio player</strong> for vocabulary study inspired by <a style="color: var(--accent)" href="https://www.youtube.com/@NaturalLanguageLearning" target="_blank">Mikel | Hyperpolyglot's YouTube channel</a>.</p>
    <p>Load a deck, click any <em>Word</em> or <em>Example</em> to hear it, or use <em>Auto-play</em> for hands-free listening. Track progress with <em>Familiarity</em> ★ ratings and export your updated CSV anytime. Use it for the most frequent <strong>verbs, nouns, phrases, or any mix</strong> you want to learn.</p>

    <h2>Quick start</h2>
    <ol>
      <li><strong>Load a CSV</strong> (Load/Export panel → <em>Choose file</em>).<br>
          - Required columns: <code>word</code>, <code>example</code>.<br>
          - Optional: <code>translation</code>, <code>example_translation</code>, <code>familiarity</code> (0-5).<br>
          - <strong>Example CSVs</strong> are available in the <code>/decks</code> folder.
      </li>
      <li><strong>Playback</strong>: pick a <em>Voice</em>, adjust <em>Speed</em> and <em>Volume</em>, then toggle:
          <em>Loop</em>, <em>Shuffle</em>, <em>Words</em>, <em>Examples</em>, <em>Include translations</em>. Click <strong>Auto-play</strong>.</li>
      <li><strong>Study</strong>: click any <span style="color: var(--accent)">highlighted</span> <em>Word</em> or <em>Example</em> to hear it once; set ★ in the <em>Familiarity</em> column (0-5).</li>
      <li><strong>Filter</strong>: use the <em>Familiarity</em> range slider, then <strong>Apply</strong> to focus on a band (e.g., 0-2).</li>
      <li><strong>Export</strong>: <em>Export CSV</em> saves a copy with your current familiarity ratings (everything runs locally).</li>
    </ol>

    <h2>CSV format</h2>
    <pre><code>
word|example|translation|example_translation|familiarity
sein|Ich bin müde.|to be|I am tired.|2
haben|Wir haben Zeit.|to have|We have time.|1
gehen|Er geht nach Hause.|to go|He goes home.|0</code>
    </pre>
    <p><em>Note:</em> In order to support rich examples, the CSV uses <code>|</code> (pipe) as the column separator instead of the more common comma. Column names are case-insensitive; extra columns are ignored.</p>

    <h2>Suggested study flow</h2>
    <ol>
      <li><strong>Passive listening (background)</strong>: turn on <em>Auto-play</em> (optionally <em>Shuffle</em> + <em>Loop</em>) while commuting, walking, or doing chores.</li>
      <li><strong>Active blocks</strong>:
        <ul>
          <li><strong>Round A - Listen while reading:</strong> follow each sentence as it's spoken; keep <em>Include translations</em> on so meaning is clear.</li>
          <li><strong>Round B - Active recall:</strong> look at the <em>translation</em>, say the <em>target</em> sentence out loud from memory, then check. Expect mistakes - they're part of learning.</li>
        </ul>
        Alternate A → B → A across batches of 100-300 rows (or any size you like).
      </li>
      <li><strong>Bridge to native content:</strong> once deck items feel easy, alternate 5-20 minutes of your deck with 5-20 minutes of real podcasts/videos you enjoy. If it's overwhelming, jump back to the deck; repeat. As you improve, raise <em>Speed</em> (e.g., 1.25× → 1.5×) so authentic content feels easier.</li>
      <li><strong>Mnemonics (optional):</strong> for hard items, invent quick sound-alike images/stories to link <em>sound ↔ meaning</em>.</li>
    </ol>

    <h2>7-day sprint (example)</h2>
    <ul>
      <li><strong>Daily passive:</strong> 60-120 min of Auto-play in the background.</li>
      <li><strong>Daily focused:</strong> 2-3 × 25-min Pomodoros (Round A / Round B).</li>
    </ul>
    <table>
      <thead><tr><th align="left">Day</th><th align="left">Focus</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Round A on rows 1-300 (listen while reading, translations on).</td></tr>
        <tr><td>2</td><td>Round B on rows 1-300 (active recall).</td></tr>
        <tr><td>3</td><td>Round A on rows 300-600.</td></tr>
        <tr><td>4</td><td>Round B on rows 300-600.</td></tr>
        <tr><td>5</td><td>Filter 0-2 and clean up weak items; update ★ ratings.</td></tr>
        <tr><td>6</td><td>Alternate deck ↔ native audio (several cycles).</td></tr>
        <tr><td>7</td><td>Increase Speed; continue alternating; Export CSV to save progress.</td></tr>
      </tbody>
    </table>

    <h2>Tips</h2>
    <ul>
      <li><strong>Pick a matching voice</strong> (e.g., de-DE, fr-FR, es-MX) for the best TTS.</li>
      <li><strong>Shuffle</strong> prevents memorising fixed order; <strong>Filter</strong> to focus on weak items (0-2).</li>
      <li><strong>Speak out loud</strong> during recall - production solidifies memory.</li>
      <li><strong>Short, frequent reps</strong> beat marathon sessions; export regularly to back up your ★ progress.</li>
    </ul>

    <h2>Troubleshooting</h2>
    <ul>
      <li><strong>No speech / missing voices?</strong> Use a modern browser (Chrome/Edge/Safari) with Speech Synthesis. Voices come from your OS and may take a moment to appear.</li>
      <li><strong>CSV won't load?</strong> Ensure headers include <code>word</code> and <code>example</code>. Optional fields are supported but not required.</li>
      <li><strong>Privacy:</strong> Everything runs locally in your browser. Familiarity updates are written only when you <em>Export deck</em>.</li>
    </ul>

    <p><strong>You've got this.</strong> Listen a lot, recall actively, and bridge to native content - tailor decks to verbs, nouns, phrases, or any mix that fits your goals.</p>
  </article>
`;

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>\"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function starHtml(value, deckIndex) {
    const stars = Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        return `<span class="star ${n <= value ? 'on' : ''}" data-v="${n}">★</span>`;
    });

    stars.unshift(`<span class="star" data-v="0">✰</span>`);
    return `<span class="stars" data-v="${value}" data-i="${deckIndex}">${stars.join('')}</span>`;
}

export function updateRangeFill(el) {
    if (!el) return;
    const min = Number(el.min || 0);
    const max = Number(el.max || 100);
    const val = Number(el.value || 0);
    const pct = ((val - min) * 100) / (max - min);
    el.style.setProperty('--fill', `${pct}%`);
}

export function clampFamRange({ minSel, maxSel, minLabel, maxLabel }, changedEl) {
    if (!minSel || !maxSel) return;

    let min = Number(minSel.value || 0);
    let max = Number(maxSel.value || 5);

    if (min > max) {
        if (changedEl === minSel) { max = min; maxSel.value = String(max); }
        else { min = max; minSel.value = String(min); }
    }

    if (minLabel) minLabel.textContent = String(min);
    if (maxLabel) maxLabel.textContent = String(max);

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

export function renderDeckTable({ deck, filteredIndices, tbody, table, exportBtn, getFam, onSpeak, onFamiliarityChange }) {
    if (!tbody) return;

    tbody.innerHTML = '';

    filteredIndices.forEach((deckIndex, ix) => {
        const row = deck[deckIndex];
        const tr = document.createElement('tr');
        tr.dataset.i = String(deckIndex);
        tr.innerHTML = `
      <td class="muted">${ix + 1}</td>
      <td class="speak" data-i="${deckIndex}" data-field="word">${escapeHtml(row.word)}</td>
      <td class="speak" data-i="${deckIndex}" data-field="example">${escapeHtml(row.example)}</td>
      <td class="muted">${escapeHtml(row.translation)}</td>
      <td class="muted">${escapeHtml(row.example_translation)}</td>
      <td>${starHtml(getFam(row._id, row.familiarity), deckIndex)}</td>
    `;
        tbody.appendChild(tr);
    });

    if (table) table.classList.toggle('hidden', filteredIndices.length === 0);
    if (exportBtn) exportBtn.disabled = deck.length === 0;

    tbody.querySelectorAll('.speak').forEach(el => {
        el.addEventListener('click', () => {
            const i = Number(el.dataset.i);
            const field = el.dataset.field;
            if (Number.isInteger(i) && field) onSpeak?.(i, field);
        });
    });

    tbody.querySelectorAll('.stars').forEach(st => {
        st.addEventListener('click', (e) => {
            const i = Number(st.dataset.i);
            const v = Number(e.target.dataset.v ?? st.dataset.v);
            if (Number.isInteger(i) && Number.isInteger(v)) onFamiliarityChange?.(i, v);
        });
    });
}

export function setDeckInfo(text) {
    if (!elements.deckInfo) return;
    elements.deckInfo.textContent = text;
    elements.deckInfo.classList.remove('hidden');
}

let helpState = {
    modal: null,
    content: null,
};

export function openHelp() {
    if (!helpState.modal || !helpState.content) return;
    helpState.content.innerHTML = HELP_HTML;
    helpState.modal.setAttribute('aria-hidden', 'false');
    helpState.modal.querySelector('.bf-help-close')?.focus();
}

export function closeHelp() {
    if (!helpState.modal || !helpState.content) return;
    helpState.modal.setAttribute('aria-hidden', 'true');
    helpState.content.innerHTML = '';
}

export function initHelpModal({ modal, content, trigger }) {
    helpState = { modal, content };
    trigger?.addEventListener('click', openHelp);

    modal?.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-help-close')) closeHelp();
    });

    document.addEventListener('keydown', (e) => {
        if (modal?.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') closeHelp();
    });
}

export function setupThemeToggle(button) {
    if (!button) return;
    const key = 'bf27:theme';
    const root = document.documentElement;
    const apply = (mode) => {
        root.setAttribute('data-theme', mode);
        button.textContent = (mode === 'light') ? '☀️ Light' : '🌙 Dark';
        button.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
    };
    const stored = localStorage.getItem(key) || 'light';
    apply(stored);

    button.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        localStorage.setItem(key, next);
        apply(next);
    });
}
