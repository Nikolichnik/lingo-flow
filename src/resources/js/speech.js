import { getRow, buildAutoQueue, bumpFam } from './deck-store.js';

let voices = [];
let playing = false;
let autoQueue = [];
let lastHighlightedRow = -1;

const state = {
    rateInput: null,
    rateDisplay: null,
    volumeInput: null,
    volumeDisplay: null,
    voiceSelect: null,
    speakTranslationsChk: null,
    playButton: null,
    stopButton: null,
    tableBody: null,
    defaults: {
        voiceLocaleHint: 'de-DE',
        voiceNameHint: 'Anna',
    },
};

function updateDisplays() {
    if (state.rateDisplay && state.rateInput) {
        state.rateDisplay.textContent = `${Number(state.rateInput.value).toFixed(1)}×`;
    }
    if (state.volumeDisplay && state.volumeInput) {
        state.volumeDisplay.textContent = `${Math.round(Number(state.volumeInput.value) * 100)}%`;
    }
}

function setControlsPlaying(isPlaying) {
    if (state.playButton) state.playButton.disabled = isPlaying;
    if (state.stopButton) state.stopButton.disabled = !isPlaying;
}

function clearRowHighlight(index) {
    if (index < 0) return;
    const rowEl = state.tableBody?.querySelector(`tr[data-i="${index}"]`);
    rowEl?.classList.remove('playing');
}

function highlightRow(index) {
    if (lastHighlightedRow !== index) {
        clearRowHighlight(lastHighlightedRow);
        lastHighlightedRow = index;
    }
    const rowEl = state.tableBody?.querySelector(`tr[data-i="${index}"]`);
    rowEl?.classList.add('playing');
}

function pickDefaultVoice() {
    const voiceSelect = state.voiceSelect;
    if (!voiceSelect || !voiceSelect.options.length) return;

    let indexByName = -1;
    let indexByLocale = -1;

    [...voiceSelect.options].forEach((option, index) => {
        const text = option.textContent || '';
        const locale = (option.getAttribute('data-lang') || '').toLowerCase();
        if (text.includes(state.defaults.voiceNameHint)) indexByName = index;
        if (locale.startsWith(state.defaults.voiceLocaleHint.toLowerCase())) indexByLocale = index;
    });

    const chosenIndex = indexByName >= 0 ? indexByName : (indexByLocale >= 0 ? indexByLocale : 0);
    voiceSelect.selectedIndex = Math.max(0, chosenIndex);
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    if (!state.voiceSelect) return;

    state.voiceSelect.innerHTML = voices
        .map((voice, index) => `<option value="${index}" data-lang="${voice.lang}">${voice.name} (${voice.lang})</option>`)
        .join('');
    pickDefaultVoice();
}

function getSelectedVoice() {
    if (!state.voiceSelect) return null;
    const index = Number(state.voiceSelect.value) | 0;
    return voices[index] || null;
}

function speak(text) {
    if (!text || !text.trim()) return Promise.resolve();

    const utterance = new SpeechSynthesisUtterance(text);
    if (state.rateInput) utterance.rate = Number(state.rateInput.value);
    if (state.volumeInput) utterance.volume = Number(state.volumeInput.value);
    const voice = getSelectedVoice();
    if (voice) utterance.voice = voice;

    return new Promise((resolve) => {
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
    });
}

function pauseBetweenItems() {
    const rate = state.rateInput ? Number(state.rateInput.value) : 1;
    return 600 / (rate || 1);
}

export function initSpeech({
    rateInput,
    rateDisplay,
    volumeInput,
    volumeDisplay,
    voiceSelect,
    speakTranslationsChk,
    playButton,
    stopButton,
    tableBody,
}, defaults = {}) {
    state.rateInput = rateInput;
    state.rateDisplay = rateDisplay;
    state.volumeInput = volumeInput;
    state.volumeDisplay = volumeDisplay;
    state.voiceSelect = voiceSelect;
    state.speakTranslationsChk = speakTranslationsChk;
    state.playButton = playButton;
    state.stopButton = stopButton;
    state.tableBody = tableBody;
    state.defaults = { ...state.defaults, ...defaults };

    updateDisplays();

    if (!('speechSynthesis' in window)) {
        alert('Your browser does not support Speech Synthesis (Web Speech API). Try Chrome/Edge/Safari.');
        return;
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    setControlsPlaying(false);
}

export async function speakRow(index, field) {
    const row = getRow(index);
    if (!row) return;

    const rowEl = state.tableBody?.querySelector(`tr[data-i="${index}"]`);
    const cellEl = rowEl?.querySelector(field === 'word' ? 'td:nth-child(2)' : 'td:nth-child(3)');
    cellEl?.classList.add('speaking');

    try {
        const sequence = [];
        if (field === 'word') sequence.push(row.word);
        if (field === 'example') sequence.push(row.example);

        if (state.speakTranslationsChk?.checked) {
            if (field === 'word' && row.translation) sequence.push(row.translation);
            if (field === 'example' && row.example_translation) sequence.push(row.example_translation);
        }

        for (const text of sequence) {
            await speak(text);
        }
    } finally {
        cellEl?.classList.remove('speaking');
    }
}

export async function runAutoPlay({ includeWords, includeExamples, shuffle, loop }) {
    if (playing) return;

    playing = true;
    setControlsPlaying(true);

    autoQueue = buildAutoQueue({ includeWords, includeExamples, shuffle });

    if (autoQueue.length === 0) {
        playing = false;
        setControlsPlaying(false);
        return;
    }

    do {
        for (const [index, column] of autoQueue) {
            if (!playing) break;

            highlightRow(index);
            await speakRow(index, column);
            await new Promise((resolve) => setTimeout(resolve, pauseBetweenItems()));

            const row = getRow(index);
            if (row) bumpFam(row._id, 0.1, row.familiarity);
        }
    } while (playing && loop);

    clearRowHighlight(lastHighlightedRow);
    lastHighlightedRow = -1;

    playing = false;
    setControlsPlaying(false);
}

export function stopPlayback() {
    playing = false;
    window.speechSynthesis.cancel();
    clearRowHighlight(lastHighlightedRow);
    lastHighlightedRow = -1;
    setControlsPlaying(false);
}

export function refreshDisplays() {
    updateDisplays();
}
