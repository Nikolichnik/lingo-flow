let deck = [];
let filteredIdx = [];
let deckKey = 'default';

function famKey(id) {
    return `bf27:fam:${deckKey}:${id}`;
}

export function setDeck(newDeck, key = 'default') {
    deck = Array.isArray(newDeck) ? newDeck : [];
    deckKey = key || 'default';
    filteredIdx = [];
}

export function getDeck() {
    return deck;
}

export function getDeckKey() {
    return deckKey;
}

export function getFam(id, fallback) {
    const v = localStorage.getItem(famKey(id));

    return v == null ? (Number(fallback) || 0) : Number(v);
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
    const lo2 = Math.min(lo, hi);
    const hi2 = Math.max(lo, hi);

    filteredIdx = deck
        .map((_, i) => i)
        .filter(i => {
            const f = getFam(deck[i]._id, deck[i].familiarity);
            return f >= lo2 && f <= hi2;
        });

    return filteredIdx;
}

export function getFilteredIndices() {
    return filteredIdx;
}

export function getRow(index) {
    return deck[index];
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function buildAutoQueue({ includeWords, includeExamples, shuffle: shouldShuffle }) {
    const cols = [];

    if (includeWords) cols.push('word');
    if (includeExamples) cols.push('example');

    const idx = [...filteredIdx];
    if (shouldShuffle) shuffle(idx);

    const queue = [];
    for (const i of idx) {
        for (const col of cols) {
            queue.push([i, col]);
        }
    }

    return queue;
}
