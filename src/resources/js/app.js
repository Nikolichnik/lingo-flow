import { parseCSV, toCSV } from './csv.js';
import {
    elements,
    updateRangeFill,
    clampFamRange,
    renderDeckTable,
    setDeckInfo,
    initHelpModal,
    setupThemeToggle,
} from './ui.js';
import {
    setDeck,
    getDeck,
    getDeckKey,
    getFam,
    setFam,
    updateFilteredIndices,
} from './deck-store.js';
import {
    initSpeech,
    runAutoPlay,
    stopPlayback,
    speakRow,
    refreshDisplays,
} from './speech.js';

const DEFAULTS = {
    rate: 1.0,
    volume: 1.0,
    voiceLocaleHint: 'de-DE',
    voiceNameHint: 'Anna',
};

async function handleFileLoad(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const deckKey = (file.name || 'deck').replace(/\.[^/.]+$/, '');
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
        alert('Empty CSV');
        return;
    }

    const header = rows[0].map((h) => (h || '').trim().toLowerCase());
    const wordIdx = header.indexOf('word') >= 0 ? header.indexOf('word') : header.indexOf('words');
    const exampleIdx = header.indexOf('example');
    const translationIdx = header.indexOf('translation');
    const exTransIdx = header.indexOf('example_translation');
    const famIdx = header.indexOf('familiarity');

    if (wordIdx < 0 || exampleIdx < 0) {
        alert('CSV must include columns: word, example. Optional: translation, example_translation, familiarity.');
        return;
    }

    const deck = rows
        .slice(1)
        .filter((row) => row.some((cell) => (cell || '').trim().length))
        .map((row, index) => ({
            _id: index + 1,
            word: row[wordIdx] || '',
            example: row[exampleIdx] || '',
            translation: translationIdx >= 0 ? (row[translationIdx] || '') : '',
            example_translation: exTransIdx >= 0 ? (row[exTransIdx] || '') : '',
            familiarity: famIdx >= 0 ? Number(row[famIdx] || 0) : 0,
        }));

    setDeck(deck, deckKey);
    setDeckInfo(`${file.name} • ${deck.length} rows`);

    if (elements.minSel) elements.minSel.value = '0';
    if (elements.maxSel) elements.maxSel.value = '5';

    clampFamRange({
        minSel: elements.minSel,
        maxSel: elements.maxSel,
        minLabel: elements.minFamVal,
        maxLabel: elements.maxFamVal,
    });

    populateTable();
}

function populateTable() {
    const indices = updateFilteredIndices(elements.minSel?.value ?? 0, elements.maxSel?.value ?? 5);

    renderDeckTable({
        deck: getDeck(),
        filteredIndices: indices,
        tbody: elements.tbody,
        table: elements.table,
        exportBtn: elements.exportBtn,
        getFam,
        onSpeak: (index, field) => speakRow(index, field),
        onFamiliarityChange: (deckIndex, value) => {
            const row = getDeck()[deckIndex];
            if (!row) return;
            setFam(row._id, value);
            populateTable();
        },
    });
}

function exportDeck() {
    const deck = getDeck();
    if (deck.length === 0) return;

    const csv = toCSV(deck, getFam);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${getDeckKey()}-with-familiarity.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function initEventListeners() {
    const {
        rate,
        vol,
        minSel,
        maxSel,
        playBtn,
        stopBtn,
        speakWordsChk,
        speakExamplesChk,
        speakTranslationsChk,
        shuffleChk,
        loopChk,
        exportBtn,
        fileInput,
    } = elements;

    rate?.addEventListener('input', () => {
        refreshDisplays();
        updateRangeFill(rate);
    });
    vol?.addEventListener('input', () => {
        refreshDisplays();
        updateRangeFill(vol);
    });

    [minSel, maxSel].forEach((el) => {
        el?.addEventListener('input', () => clampFamRange({
            minSel,
            maxSel,
            minLabel: elements.minFamVal,
            maxLabel: elements.maxFamVal,
        }, el));
    });

    document.getElementById('applyFilterBtn')?.addEventListener('click', populateTable);

    playBtn?.addEventListener('click', () => {
        runAutoPlay({
            includeWords: speakWordsChk?.checked,
            includeExamples: speakExamplesChk?.checked,
            shuffle: shuffleChk?.checked,
            loop: loopChk?.checked,
        });
    });

    stopBtn?.addEventListener('click', () => {
        stopPlayback();
    });

    exportBtn?.addEventListener('click', exportDeck);
    fileInput?.addEventListener('change', (event) => handleFileLoad(event));

    speakTranslationsChk?.addEventListener('change', () => {
        if (!elements.table?.classList.contains('hidden')) populateTable();
    });
}

function bootstrap() {
    setupThemeToggle(elements.themeToggleBtn);
    initHelpModal({
        modal: elements.helpModal,
        content: elements.helpContent,
        trigger: elements.helpBtn,
    });

    initSpeech({
        rateInput: elements.rate,
        rateDisplay: elements.rateVal,
        volumeInput: elements.vol,
        volumeDisplay: elements.volVal,
        voiceSelect: elements.voiceSel,
        speakTranslationsChk: elements.speakTranslationsChk,
        playButton: elements.playBtn,
        stopButton: elements.stopBtn,
        tableBody: elements.tbody,
    }, DEFAULTS);

    clampFamRange({
        minSel: elements.minSel,
        maxSel: elements.maxSel,
        minLabel: elements.minFamVal,
        maxLabel: elements.maxFamVal,
    });

    refreshDisplays();
    updateRangeFill(elements.rate);
    updateRangeFill(elements.vol);

    initEventListeners();

    window.addEventListener('DOMContentLoaded', () => {
        updateRangeFill(elements.rate);
        updateRangeFill(elements.vol);
    });
}

bootstrap();
