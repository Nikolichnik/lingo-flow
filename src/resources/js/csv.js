export function parseCSV(text) {
    const rows = [];
    let cur = '';
    let row = [];
    let i = 0;
    let inQuotes = false;

    while (i < text.length) {
        const c = text[i];

        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                cur += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === '|') {
                row.push(cur);
                cur = '';
            } else if (c === '\n') {
                row.push(cur);
                rows.push(row);
                row = [];
                cur = '';
            } else if (c === '\r') {
                // ignore
            } else {
                cur += c;
            }
        }

        i++;
    }

    if (cur.length || row.length) {
        row.push(cur);
        rows.push(row);
    }

    if (rows.length && rows[0].length) {
        rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');
    }

    return rows;
}

export function toCSV(deck, getFam) {
    const header = ['word', 'example', 'translation', 'example_translation', 'familiarity'];
    const rows = deck.map(row => [
        row.word,
        row.example,
        row.translation,
        row.example_translation,
        Math.round(getFam(row._id, row.familiarity)),
    ]);

    return [header, ...rows]
        .map(r => r.map(cell => {
            if (cell == null) cell = '';
            const s = String(cell);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(','))
        .join('\n');
}
