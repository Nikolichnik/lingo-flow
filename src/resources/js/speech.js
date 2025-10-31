import { getRow, buildAutoQueue, bumpFam } from './deck-store.js';

let voices = [];
let playing = false;
let autoQueue = [];

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
    }
};

function pickDefaultVoice() {
    const voiceSel = state.voiceSelect;
    if (!voiceSel || !voiceSel.options.length) return;

    let indexByName = -1;
    let indexByLocale = -1;

    [...voiceSel.options].forEach((opt, i) => {
        const text = opt.textContent || '';
        const locale = (opt.getAttribute('data-lang') || '').toLowerCase();
        if (text.includes(state.defaults.voiceNameHint)) indexByName = i;
        if (locale.startsWith(state.defaults.voiceLocaleHint.toLowerCase())) indexByLocale = i;
    });

    const useIndex = indexByName >= 0 ? indexByName :
        indexByLocale >= 0 ? indexByLocale : 0;

    voiceSel.selectedIndex = Math.max(0, useIndex);
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    if (!state.voiceSelect) return;

    state.voiceSelect.innerHTML = voices
        .map((v, i) => `<option value="${i}" data-lang="${v.lang}">${v.name} (${v.lang})</option>`)
        .join('');
    pickDefaultVoice();
}

function updateDisplays() {
    if (state.rateDisplay && state.rateInput) {
        state.rateDisplay.textContent = `${Number(state.rateInput.value).toFixed(1)}×`;
    }
    if (state.volumeDisplay && state.volumeInput) {
        state.volumeDisplay.textContent = `${Math.round(Number(state.volumeInput.value) * 100)}%`;
    }
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
    tableBody
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

function getVoice() {
    if (!state.voiceSelect) return null;
    const index = Number(state.voiceSelect.value) | 0;
    return voices[index] || null;
}

export function speak(text) {
    if (!text || !text.trim()) return Promise.resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    if (state.rateInput) utterance.rate = Number(state.rateInput.value);
    if (state.volumeInput) utterance.volume = Number(state.volumeInput.value);
    const voice = getVoice();
    if (voice) utterance.voice = voice;

    return new Promise(res => {
        utterance.onend = res;
        utterance.onerror = res;
        window.speechSynthesis.speak(utterance);
    });
}

export async function speakRow(index, field) {
    const row = getRow(index);
    if (!row) return;

    const rowEl = state.tableBody?.querySelector(`tr[data-i="${index}"]`);
    const cellEl = rowEl?.querySelector(field === 'word' ? 'td:nth-child(2)' : 'td:nth-child(3)');
    cellEl?.classList.add('speaking');

    try {
        const seq = [];
        if (field === 'word') seq.push(row.word);
        if (field === 'example') seq.push(row.example);

        if (state.speakTranslationsChk?.checked) {
            if (field === 'word' && row.translation) seq.push(row.translation);
            if (field === 'example' && row.example_translation) seq.push(row.example_translation);
        }

        for (const text of seq) {
            await speak(text);
        }
    } finally {
        cellEl?.classList.remove('speaking');
    }
}

function clearRowHighlights(index) {
    if (index < 0) return;
    const rowEl = state.tableBody?.querySelector(`tr[data-i="${index}"]`);
    rowEl?.classList.remove('playing');
}

function getPauseDuration() {
    const rate = state.rateInput ? Number(state.rateInput.value) : 1;
    return 600 / (rate || 1);
}

function setControlsPlaying(isPlaying) {
    if (state.playButton) state.playButton.disabled = isPlaying;
    if (state.stopButton) state.stopButton.disabled = !isPlaying;
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

    let lastRowIndex = -1;

    do {
        for (const [index, column] of autoQueue) {
            if (!playing) break;

            if (lastRowIndex !== index) {
                clearRowHighlights(lastRowIndex);
                lastRowIndex = index;
            }

            const rowEl = state.tableBody?.querySelector(`tr[data-i="${index}"]`);
            rowEl?.classList.add('playing');

            await speakRow(index, column);

            await new Promise(res => setTimeout(res, getPauseDuration()));

            const row = getRow(index);
            if (row) bumpFam(row._id, 0.1, row.familiarity);
        }
    } while (playing && loop);

    clearRowHighlights(lastRowIndex);

    playing = false;
    setControlsPlaying(false);
}

export function stopPlayback() {
    playing = false;
    window.speechSynthesis.cancel();
    setControlsPlaying(false);
}

export function isPlaying() {
    return playing;
}

export function refreshDisplays() {
    updateDisplays();
}
