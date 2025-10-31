const DEFAULTS = {
    rate: 1.0,
    volume: 1.0,
    voiceLocaleHint: 'de-DE',
    voiceNameHint: 'Anna'
};

export function initializeSpeech({ voiceSelect, rateInput, volumeInput, defaults = DEFAULTS }) {
    const opts = { ...DEFAULTS, ...defaults };
    const synth = window.speechSynthesis;
    if (!synth) {
        alert('Your browser does not support Speech Synthesis (Web Speech API). Try Chrome/Edge/Safari.');
        return {
            speak: () => Promise.resolve(),
            speakRow: () => Promise.resolve(),
            cancel: () => {}
        };
    }

    let voices = [];

    function pickDefaultVoice() {
        if (!voiceSelect || !voiceSelect.options.length) return;

        let indexByName = -1;
        let indexByLocale = -1;

        [...voiceSelect.options].forEach((opt, i) => {
            const text = opt.textContent || '';
            const locale = (opt.getAttribute('data-lang') || '').toLowerCase();
            if (text.includes(opts.voiceNameHint)) indexByName = i;
            if (locale.startsWith(opts.voiceLocaleHint.toLowerCase())) indexByLocale = i;
        });

        const useIndex = indexByName >= 0 ? indexByName :
            indexByLocale >= 0 ? indexByLocale : 0;

        voiceSelect.selectedIndex = Math.max(0, useIndex);
    }

    function loadVoices() {
        voices = synth.getVoices();
        if (!voiceSelect) return;
        voiceSelect.innerHTML = voices
            .map((v, i) => `<option value="${i}" data-lang="${v.lang}">${v.name} (${v.lang})</option>`)
            .join('');
        pickDefaultVoice();
    }

    if (voiceSelect) {
        loadVoices();
        synth.onvoiceschanged = loadVoices;
    }

    function speak(text) {
        if (!text || !text.trim()) return Promise.resolve();
        const utterance = new SpeechSynthesisUtterance(text);
        if (rateInput) utterance.rate = Number(rateInput.value);
        if (volumeInput) utterance.volume = Number(volumeInput.value);
        const voice = voices[voiceSelect?.value | 0];
        if (voice) utterance.voice = voice;
        return new Promise(res => {
            utterance.onend = res; utterance.onerror = res;
            synth.speak(utterance);
        });
    }

    async function speakRow(row, field, { includeTranslations } = {}) {
        if (!row) return;
        const seq = [];

        if (field === 'word') seq.push(row.word);
        if (field === 'example') seq.push(row.example);

        if (includeTranslations) {
            if (field === 'word' && row.translation) seq.push(row.translation);
            if (field === 'example' && row.example_translation) seq.push(row.example_translation);
        }

        for (const part of seq) await speak(part);
    }

    function cancel() {
        synth.cancel();
    }

    return { speak, speakRow, cancel };
}
