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

// Parse CSV
const raw = fs.readFileSync('/Users/montero/Downloads/cars_ds_final.csv', 'utf8');
const rows = parseCSV(raw);
const headers = rows[0];
const data = rows.slice(1).filter(r => r.length > 5);

// Create header index map
const idx = {};
headers.forEach((h, i) => idx[h] = i);

// Group by Make + Model (aggregate variants)
const modelMap = new Map();
for (const row of data) {
    const make = row[idx['Make']] || '';
    const model = row[idx['Model']] || '';
    if (!make || !model) continue;
    const key = make + '|' + model;
    if (!modelMap.has(key)) modelMap.set(key, []);
    modelMap.get(key).push(row);
}

console.log('Unique models:', modelMap.size);
console.log('Unique makes:', new Set([...modelMap.keys()].map(k => k.split('|')[0])).size);

// Parse price string
function parsePrice(str) {
    if (!str) return 0;
    const cleaned = str.replace(/Rs\.\s*/i, '').replace(/,/g, '').trim();
    const num = parseInt(cleaned);
    return isNaN(num) ? 0 : num;
}

// Parse mileage
function parseMileage(str) {
    if (!str || str === '?') return '';
    const match = str.match(/([\d.]+)/);
    return match ? match[1] : '';
}

// Generate slug ID
function toSlug(make, model) {
    return (make + '-' + model).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Image placeholder - use brand-based search-friendly URLs
function getImagePlaceholder(make, model) {
    const q = encodeURIComponent(make + ' ' + model + ' India');
    return [
        `https://via.placeholder.com/664x374/1a2332/60a5fa?text=${encodeURIComponent(make + ' ' + model)}`,
    ];
}

// Load existing cars to preserve their data
const existingCars = JSON.parse(fs.readFileSync('/Users/montero/Desktop/AW mark I/src/data/cars.json', 'utf8'));
const existingIds = new Set(existingCars.map(c => c.id));

// Convert each model group to a car entry
const newCars = [];
for (const [key, variants] of modelMap) {
    const [make, model] = key.split('|');
    const id = toSlug(make, model);

    // Skip if we already have this car
    if (existingIds.has(id)) continue;

    // Get range of prices
    const prices = variants.map(v => parsePrice(v[idx['Ex-Showroom_Price']])).filter(p => p > 0);
    if (prices.length === 0) continue;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Aggregate fuel types
    const fuelTypes = [...new Set(variants.map(v => v[idx['Fuel_Type']]).filter(Boolean))];

    // Aggregate transmission types
    const transTypes = [...new Set(variants.map(v => v[idx['Type']]).filter(Boolean))];

    // Get first available value for fields
    const firstValid = (colName) => {
        for (const v of variants) {
            const val = v[idx[colName]];
            if (val && val.trim() && val !== '?' && val !== 'Not on offer') return val.trim();
        }
        return '';
    };

    // Parse mileage - get best available
    const cityMileage = parseMileage(firstValid('City_Mileage'));
    const hwMileage = parseMileage(firstValid('Highway_Mileage'));
    const araiMileage = parseMileage(firstValid('ARAI_Certified_Mileage'));
    const mileage = araiMileage || cityMileage || hwMileage || '0';

    const displacement = firstValid('Displacement');
    const bodyType = firstValid('Body_Type') || 'Hatchback';
    const seating = parseInt(firstValid('Seating_Capacity')) || 5;
    const bootSpace = firstValid('Boot_Space');
    const groundClearance = firstValid('Ground_Clearance');
    const fuelTank = firstValid('Fuel_Tank_Capacity');
    const power = firstValid('Power');
    const torque = firstValid('Torque');

    // Format price range
    function fmtLakh(p) {
        if (p >= 10000000) return (p / 10000000).toFixed(2) + ' Crore';
        if (p >= 100000) return (p / 100000).toFixed(2) + ' Lakh';
        return p.toLocaleString('en-IN');
    }
    const priceRange = minPrice === maxPrice
        ? `₹ ${fmtLakh(minPrice)}`
        : `₹ ${fmtLakh(minPrice)} - ${fmtLakh(maxPrice)}`;

    const car = {
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
        transmission: transTypes.join(' / ') || 'Manual',
        seatingCapacity: seating,
        bootSpace: bootSpace ? bootSpace : 'N/A',
        groundClearance: groundClearance || 'N/A',
        fuelTankCapacity: fuelTank || 'N/A',
        description: `The ${make} ${model} is available in the Indian market${fuelTypes.length ? ' with ' + fuelTypes.join('/') + ' engine options' : ''}. It comes in ${variants.length} variant${variants.length > 1 ? 's' : ''} with prices starting at ₹ ${fmtLakh(minPrice)}.`,
        images: getImagePlaceholder(make, model),
        pros: [
            fuelTypes.includes('Diesel') ? 'Diesel engine option available' : 'Efficient petrol engine',
            seating > 5 ? `Spacious ${seating}-seater layout` : 'Comfortable 5-seater cabin',
            groundClearance && parseInt(groundClearance) >= 180 ? 'Good ground clearance for Indian roads' : 'Practical for city driving',
            transTypes.includes('Automatic') ? 'Automatic transmission available' : 'Smooth manual gearbox',
            `Available in ${variants.length} variants for flexible budget`,
        ],
        cons: [
            !fuelTypes.includes('Diesel') ? 'No diesel engine option' : 'Diesel variants are pricey',
            parseFloat(mileage) < 15 ? 'Below-average fuel efficiency' : 'Mileage drops in city traffic',
            'After-sales service experience may vary',
            bootSpace && parseInt(bootSpace) < 300 ? 'Limited boot space' : 'Boot access could be wider',
            'Feature list may not match latest competitors',
        ],
        commonProblems: [
            'Minor rattles may develop over time',
            'AC performance may vary in extreme heat',
            'Periodic maintenance important for longevity',
        ],
        maintenanceCostEstimate: minPrice < 600000
            ? '₹ 3,000 - 5,000 per service (every 10,000 km)'
            : minPrice < 1500000
                ? '₹ 5,000 - 8,000 per service (every 10,000 km)'
                : '₹ 8,000 - 15,000 per service (every 10,000 km)',
    };

    newCars.push(car);
}

// Merge existing + new, sort by price
const allCars = [...existingCars, ...newCars].sort((a, b) => a.price - b.price);

console.log('Existing cars kept:', existingCars.length);
console.log('New cars from CSV:', newCars.length);
console.log('Total:', allCars.length);

fs.writeFileSync('/Users/montero/Desktop/AW mark I/src/data/cars.json', JSON.stringify(allCars, null, 2));
console.log('Written to cars.json');
