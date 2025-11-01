const DEFAULTS = {
    rate: 1.0,
    volume: 1.0,
    voiceLocaleHint: 'de-DE',
    voiceNameHint: 'Anna',
    translationVoiceNameHint: ['Google US English', 'Samantha'],
    translationVoiceLocaleHint: 'en'
};

function initializeSpeech({ voiceSelect, rateInput, volumeInput, defaults = DEFAULTS }) {
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

    function getSelectedVoice() {
        const index = Number(voiceSelect?.value ?? 0);
        return voices[index] || null;
    }

    function toArray(val) {
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
    }

    function findVoiceByNameFragment(fragment) {
        const needle = (fragment || '').toLowerCase();
        if (!needle) return null;
        return voices.find(v => (v.name || '').toLowerCase().includes(needle)) || null;
    }

    function findVoiceByLangPrefix(prefix) {
        const target = (prefix || '').toLowerCase();
        if (!target) return null;
        return voices.find(v => (v.lang || '').toLowerCase().startsWith(target)) || null;
    }

    function getTranslationVoice() {
        const current = getSelectedVoice();
        if (current?.lang?.toLowerCase().startsWith('en')) return current;
        for (const nameHint of toArray(opts.translationVoiceNameHint)) {
            const byName = findVoiceByNameFragment(nameHint);
            if (byName) return byName;
        }
        for (const localeHint of toArray(opts.translationVoiceLocaleHint)) {
            const byLocale = findVoiceByLangPrefix(localeHint);
            if (byLocale) return byLocale;
        }
        return current;
    }

    function speak(text, voiceOverride) {
        if (!text || !text.trim()) return Promise.resolve();
        const utterance = new SpeechSynthesisUtterance(text);
        if (rateInput) utterance.rate = Number(rateInput.value);
        if (volumeInput) utterance.volume = Number(volumeInput.value);
        const voice = voiceOverride || getSelectedVoice();
        if (voice) utterance.voice = voice;
        if (voice?.lang) utterance.lang = voice.lang;
        return new Promise(res => {
            utterance.onend = res; utterance.onerror = res;
            synth.speak(utterance);
        });
    }

    async function speakRow(row, field, { includeTranslations } = {}) {
        if (!row) return;
        const baseVoice = getSelectedVoice();
        const translationVoice = includeTranslations ? getTranslationVoice() : baseVoice;
        const sequence = [];

        if (field === 'word' && row.word) sequence.push({ text: row.word, voice: baseVoice });
        if (field === 'example' && row.example) sequence.push({ text: row.example, voice: baseVoice });

        if (includeTranslations) {
            if (field === 'word' && row.translation) {
                sequence.push({ text: row.translation, voice: translationVoice });
            }
            if (field === 'example' && row.example_translation) {
                sequence.push({ text: row.example_translation, voice: translationVoice });
            }
        }

        for (const part of sequence) await speak(part.text, part.voice);
    }

    function cancel() {
        synth.cancel();
    }

    return { speak, speakRow, cancel };
}

const speechModule = { initializeSpeech };

if (typeof window !== 'undefined') {
    window.LingoFlow = window.LingoFlow || {};
    window.LingoFlow.speech = speechModule;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = speechModule;
}
