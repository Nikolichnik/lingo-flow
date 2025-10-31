const DEFAULT_FILENAME_SUFFIX = '-with-familiarity.csv';

export function parseCSV(text) {
    const rows = [];
    let cur = '', row = [], i = 0, inQuotes = false;

    while (i < text.length) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { cur += '"'; i++; }
                else { inQuotes = false; }
            } else { cur += c; }
        } else {
            if (c === '"') inQuotes = true;
            else if (c === '|') { row.push(cur); cur = ''; }
            else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
            else if (c === '\r') { /* ignore */ }
            else { cur += c; }
        }
        i++;
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    if (rows.length && rows[0].length) rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');

    return rows;
}

export function exportDeckToBlob(deck, deckKey, getFam) {
    if (!Array.isArray(deck) || deck.length === 0) return null;

    const header = ['word', 'example', 'translation', 'example_translation', 'familiarity'];
    const rows = deck.map(r => [
        r.word,
        r.example,
        r.translation,
        r.example_translation,
        Math.round(getFam(r._id, r.familiarity))
    ]);
    const csv = [header, ...rows]
        .map(r => r.map(cell => {
            if (cell == null) cell = '';
            const s = String(cell);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(','))
        .join('\n');

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

export function triggerDeckDownload(deck, deckKey, getFam) {
    const blob = exportDeckToBlob(deck, deckKey, getFam);
    if (!blob) return;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${deckKey}${DEFAULT_FILENAME_SUFFIX}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}
