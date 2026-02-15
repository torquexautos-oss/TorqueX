const fs = require('fs');
const path = require('path');

// ── CSV Parser ──────────────────────────────────────────────────
function parseCSV(text) {
    const rows = [];
    for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        const row = [];
        let current = '', inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') inQuotes = !inQuotes;
            else if (ch === ',' && !inQuotes) { row.push(current.trim()); current = ''; }
            else current += ch;
        }
        row.push(current.trim());
        rows.push(row);
    }
    return rows;
}

// ── Parse CSV ───────────────────────────────────────────────────
const raw = fs.readFileSync('/Users/montero/Downloads/cars_ds_final.csv', 'utf8');
const rows = parseCSV(raw);
const headers = rows[0];
const data = rows.slice(1).filter(r => r.length > 5);
const idx = {};
headers.forEach((h, i) => idx[h] = i);

// ── Filter BS6 only ─────────────────────────────────────────────
const bs6Rows = data.filter(r => {
    const norm = (r[idx['Emission_Norm']] || '').toUpperCase();
    return norm.includes('BS VI') || norm.includes('BS 6');
});

// ── Group by Make + Model ───────────────────────────────────────
const modelMap = new Map();
for (const row of bs6Rows) {
    const make = row[idx['Make']] || '';
    const model = row[idx['Model']] || '';
    if (!make || !model) continue;
    const key = make + '|' + model;
    if (!modelMap.has(key)) modelMap.set(key, []);
    modelMap.get(key).push(row);
}

// ── Helpers ─────────────────────────────────────────────────────
function parsePrice(str) {
    if (!str) return 0;
    const num = parseInt(str.replace(/Rs\.\s*/i, '').replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
}
function parseMileage(str) {
    if (!str || str === '?') return '';
    const m = str.match(/([\d.]+)/);
    return m ? m[1] : '';
}
function toSlug(make, model) {
    return (make + '-' + model).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function fmtLakh(p) {
    if (p >= 10000000) return '₹ ' + (p / 10000000).toFixed(2) + ' Cr';
    return '₹ ' + (p / 100000).toFixed(2) + ' Lakh';
}

// ── Convert to car objects ──────────────────────────────────────
const cars = [];
for (const [key, variants] of modelMap) {
    const [make, model] = key.split('|');
    const id = toSlug(make, model);

    const firstValid = (col) => {
        for (const v of variants) {
            const val = v[idx[col]];
            if (val && val.trim() && val !== '?' && val !== 'Not on offer') return val.trim();
        }
        return '';
    };

    const prices = variants.map(v => parsePrice(v[idx['Ex-Showroom_Price']])).filter(p => p > 0);
    if (prices.length === 0) continue;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const fuelTypes = [...new Set(variants.map(v => v[idx['Fuel_Type']]).filter(Boolean))];
    const transTypes = [...new Set(variants.map(v => v[idx['Type']]).filter(Boolean))];
    const mileage = parseMileage(firstValid('ARAI_Certified_Mileage')) || parseMileage(firstValid('City_Mileage')) || parseMileage(firstValid('Highway_Mileage')) || '0';

    const displacement = firstValid('Displacement');
    const bodyType = firstValid('Body_Type') || 'Hatchback';
    const seating = parseInt(firstValid('Seating_Capacity')) || 5;
    const power = firstValid('Power');
    const torque = firstValid('Torque');

    const priceRange = minPrice === maxPrice ? fmtLakh(minPrice) : `${fmtLakh(minPrice)} - ${fmtLakh(maxPrice)}`;

    cars.push({
        id,
        name: make + ' ' + model,
        brand: make,
        price: minPrice,
        priceRange,
        mileage,
        fuelType: fuelTypes.join(' / '),
        bodyType,
        engine: displacement || 'N/A',
        engineDetails: `${displacement} ${power ? '(' + power + ')' : ''}`.trim(),
        power: power || 'N/A',
        torque: torque || 'N/A',
        transmission: transTypes.join(' / ') || 'Manual',
        seatingCapacity: seating,
        bootSpace: firstValid('Boot_Space') || 'N/A',
        groundClearance: firstValid('Ground_Clearance') || 'N/A',
        fuelTankCapacity: firstValid('Fuel_Tank_Capacity') || 'N/A',
        emissionNorm: 'BS6',
        description: `The ${make} ${model} is a BS6-compliant ${bodyType.split(',')[0].trim().toLowerCase()} available in ${variants.length} variant${variants.length > 1 ? 's' : ''}. Prices range from ${priceRange}.`,
        images: [`/images/cars/${id}.svg`],
        pros: [
            'BS6 emission compliant',
            fuelTypes.includes('Diesel') ? 'Diesel engine option available' : 'Efficient petrol engine',
            seating > 5 ? `Spacious ${seating}-seater layout` : 'Comfortable 5-seater cabin',
            transTypes.includes('Automatic') ? 'Automatic transmission available' : 'Smooth manual gearbox',
            `Available in ${variants.length} variants`,
        ],
        cons: [
            !fuelTypes.includes('Diesel') ? 'No diesel engine option' : 'Diesel variants are pricier',
            parseFloat(mileage) < 15 ? 'Below-average fuel efficiency' : 'Mileage drops in city traffic',
            'After-sales service experience may vary',
            'Feature list may trail latest competitors',
            'Spare parts pricing varies by region',
        ],
        commonProblems: [
            'Minor rattles may develop over time',
            'AC performance may vary in extreme heat',
            'Regular maintenance is key for longevity',
        ],
        maintenanceCostEstimate: minPrice < 600000
            ? '₹ 3,000 - 5,000 per service (every 10,000 km)'
            : minPrice < 1500000
                ? '₹ 5,000 - 8,000 per service (every 10,000 km)'
                : minPrice < 5000000
                    ? '₹ 8,000 - 15,000 per service (every 10,000 km)'
                    : '₹ 15,000 - 30,000 per service (every 10,000 km)',
    });
}

cars.sort((a, b) => a.price - b.price);

fs.writeFileSync('/Users/montero/Desktop/AW mark I/src/data/cars.json', JSON.stringify(cars, null, 2));
console.log(`Written ${cars.length} BS6 cars to cars.json`);
console.log('Brands:', [...new Set(cars.map(c => c.brand))].sort().join(', '));
