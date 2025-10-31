let deck = [];
let filteredIndices = [];
let deckKey = 'default';

function famKey(id) {
    return `bf27:fam:${deckKey}:${id}`;
}

export function setDeck(newDeck, key = 'default') {
    deck = Array.isArray(newDeck) ? newDeck : [];
    deckKey = key || 'default';
    filteredIndices = deck.map((_, index) => index);
}

export function getDeck() {
    return deck;
}

export function getDeckKey() {
    return deckKey;
}

export function getRow(index) {
    return deck[index];
}

export function getFam(id, fallback) {
    const stored = localStorage.getItem(famKey(id));
    return stored == null ? (Number(fallback) || 0) : Number(stored);
}

export function setFam(id, value) {
    localStorage.setItem(famKey(id), String(value));
}

export function bumpFam(id, delta, fallback) {
    const current = getFam(id, fallback);
    const next = Math.min(5, current + delta);
    setFam(id, next);
}

export function updateFilteredIndices(min, max) {
    const lo = Number(min);
    const hi = Number(max);
    const minValue = Math.min(lo, hi);
    const maxValue = Math.max(lo, hi);

    filteredIndices = deck
        .map((_, index) => index)
        .filter((index) => {
            const row = deck[index];
            const fam = getFam(row._id, row.familiarity);
            return fam >= minValue && fam <= maxValue;
        });

    return filteredIndices;
}

export function getFilteredIndices() {
    return filteredIndices;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function buildAutoQueue({ includeWords, includeExamples, shuffle: shouldShuffle }) {
    const columns = [];

    if (includeWords) columns.push('word');
    if (includeExamples) columns.push('example');

    const indices = [...filteredIndices];
    if (shouldShuffle) shuffle(indices);

    const queue = [];
    for (const index of indices) {
        for (const column of columns) {
            queue.push([index, column]);
        }
    }

    return queue;
}
