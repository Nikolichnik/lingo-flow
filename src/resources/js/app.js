import { parseCSV, triggerDeckDownload } from './csv.js';
import { createDeckStore } from './deck-store.js';
import { initializeSpeech } from './speech.js';
import { bootstrap } from './ui.js';

const deckStore = createDeckStore();

bootstrap({
    deckStore,
    csv: { parseCSV, triggerDeckDownload },
    initializeSpeech
});
