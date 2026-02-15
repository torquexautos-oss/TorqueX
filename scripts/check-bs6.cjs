const fs = require('fs');

// Simple CSV parser that handles quoted fields
function parseCSV(text) {
    const rows = [];
    const lines = text.split('\n');
    for (const line of lines) {
        if (!line.trim()) continue;
        const row = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        row.push(current.trim());
        rows.push(row);
    }
    return rows;
}

const raw = fs.readFileSync('/Users/montero/Downloads/cars_ds_final.csv', 'utf8');
const rows = parseCSV(raw);
const headers = rows[0];
const data = rows.slice(1).filter(r => r.length > 5);

const idx = {};
headers.forEach((h, i) => idx[h] = i);

// Count emission norms
const norms = {};
for (const row of data) {
    const norm = row[idx['Emission_Norm']] || 'Unknown';
    norms[norm] = (norms[norm] || 0) + 1;
}
console.log('Emission Norms:', norms);

// Filter BS VI / BS6 rows
const bs6Rows = data.filter(r => {
    const norm = (r[idx['Emission_Norm']] || '').toUpperCase();
    return norm.includes('BS VI') || norm.includes('BS 6');
});

console.log('BS6 rows:', bs6Rows.length);

// Group by Make + Model
const modelMap = new Map();
for (const row of bs6Rows) {
    const make = row[idx['Make']] || '';
    const model = row[idx['Model']] || '';
    if (!make || !model) continue;
    const key = make + '|' + model;
    if (!modelMap.has(key)) modelMap.set(key, []);
    modelMap.get(key).push(row);
}

console.log('BS6 unique models:', modelMap.size);
console.log('BS6 makes:', [...new Set([...modelMap.keys()].map(k => k.split('|')[0]))].sort().join(', '));
console.log('Models:');
[...modelMap.keys()].sort().forEach(k => {
    const [make, model] = k.split('|');
    console.log(`  ${make} ${model} (${modelMap.get(k).length} variants)`);
});
