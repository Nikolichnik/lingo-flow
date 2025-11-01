const DEFAULT_DECK_KEY = 'default';
const FAM_KEY_PREFIX = 'bf27:fam:';

function shuffle(indices) {
    for (let i = indices.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
}

function createDeckStore(storage = window.localStorage) {
    let deck = [];
    let deckKey = DEFAULT_DECK_KEY;
    let filteredIdx = [];

    function famKey(id) {
        return `${FAM_KEY_PREFIX}${deckKey}:${id}`;
    }

    function getFam(id, fallback) {
        const v = storage.getItem(famKey(id));
        return v == null ? (Number(fallback) || 0) : Number(v);
    }

    function setFam(id, value) {
        storage.setItem(famKey(id), String(value));
    }

    function setDeck(nextDeck, key = DEFAULT_DECK_KEY) {
        deck = nextDeck;
        deckKey = key || DEFAULT_DECK_KEY;
        filteredIdx = [];
    }

    function getDeck() {
        return deck;
    }

    function getDeckKey() {
        return deckKey;
    }

    function filterByFamiliarity(min, max) {
        const lo = Number(min);
        const hi = Number(max);
        const lo2 = Math.min(lo, hi);
        const hi2 = Math.max(lo, hi);

        filteredIdx = deck.map((_, i) => i).filter(i => {
            const f = getFam(deck[i]._id, deck[i].familiarity);
            return f >= lo2 && f <= hi2;
        });

        return filteredIdx;
    }

    function getFilteredIndices() {
        return filteredIdx;
    }

    function setFilteredOrder(order) {
        if (!Array.isArray(order)) return;
        filteredIdx = order.slice();
    }

    function getRow(index) {
        return deck[index];
    }

    function buildQueue({ includeWords, includeExamples, shuffle: shouldShuffle }) {
        const cols = [];
        if (includeWords) cols.push('word');
        if (includeExamples) cols.push('example');

        const idx = [...filteredIdx];
        if (shouldShuffle) shuffle(idx);

        const queue = [];
        for (const i of idx) for (const c of cols) queue.push([i, c]);

        return queue;
    }

    function adjustFamiliarity(id, delta, maxValue = 5) {
        const current = getFam(id, 0);
        const next = Math.min(maxValue, current + delta);
        setFam(id, next);
    }

    function buildDeckFromRows(rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error('Empty CSV');
        }

        const header = rows[0].map(h => (h || '').trim().toLowerCase());
        const wordIdx = header.indexOf('word') >= 0 ? header.indexOf('word') : header.indexOf('words');
        const exampleIdx = header.indexOf('example');
        const translationIdx = header.indexOf('translation');
        const exTransIdx = header.indexOf('example_translation');
        const famIdx = header.indexOf('familiarity');

        if (wordIdx < 0 || exampleIdx < 0) {
            throw new Error('CSV must include columns: word, example. Optional: translation, example_translation, familiarity.');
        }

        return rows
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
    }

    return {
        setDeck,
        getDeck,
        getDeckKey,
        filterByFamiliarity,
        getFilteredIndices,
        getRow,
        buildQueue,
        getFam,
        setFam,
        adjustFamiliarity,
        buildDeckFromRows,
        setFilteredOrder
    };
}

const deckStoreModule = { createDeckStore };

if (typeof window !== 'undefined') {
    window.LingoFlow = window.LingoFlow || {};
    window.LingoFlow.deckStore = deckStoreModule;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = deckStoreModule;
}
