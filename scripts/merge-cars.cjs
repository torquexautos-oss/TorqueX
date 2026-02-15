const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('/Users/montero/Downloads/new_indian_cars_2020_2025.json', 'utf8'));

// Also load existing cars for merging
const existing = JSON.parse(fs.readFileSync('/Users/montero/Desktop/AW mark I/src/data/cars.json', 'utf8'));

function toSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function parsePrice(str) {
    if (!str) return 0;
    // Handle "₹7.74 - 13.04 Lakh" or "₹11.56 - 19.41 Lakh"
    const m = str.match(/([\d.]+)/);
    if (!m) return 0;
    const val = parseFloat(m[1]);
    if (str.toLowerCase().includes('cr')) return Math.round(val * 10000000);
    return Math.round(val * 100000);
}

// Convert new cars to normalized format
const newCars = raw.map(car => {
    const id = toSlug(car.name);
    return {
        id,
        name: car.name,
        brand: car.brand,
        price: parsePrice(car.price),
        priceRange: car.price,
        mileage: '0',
        fuelType: car.fuel || 'Petrol',
        bodyType: car.bodyType || 'SUV',
        engine: car.engine || 'N/A',
        engineDetails: `${car.engine || ''} (${car.power || 'N/A'})`.trim(),
        power: car.power || 'N/A',
        torque: car.torque || 'N/A',
        transmission: 'Manual / Automatic',
        seatingCapacity: 5,
        bootSpace: 'N/A',
        groundClearance: 'N/A',
        fuelTankCapacity: 'N/A',
        emissionNorm: 'BS6',
        year: car.year || 2024,
        description: `The ${car.name} is a ${(car.bodyType || 'car').toLowerCase()} by ${car.brand}, priced at ${car.price}.`,
        images: [`/images/cars/${id}.svg`],
        pros: [
            'BS6 emission compliant',
            'Modern design language',
            car.fuel === 'Electric' ? 'Zero emissions' : 'Efficient engine',
            'Good build quality',
            'Competitive pricing',
        ],
        cons: [
            'After-sales service varies by region',
            'Feature list may trail latest competitors',
            'Spare parts pricing varies',
        ],
        commonProblems: [
            'Minor rattles may develop over time',
            'AC performance may vary in extreme heat',
            'Regular maintenance is key for longevity',
        ],
        maintenanceCostEstimate: parsePrice(car.price) < 800000
            ? '₹3,000 - 5,000 per service'
            : parsePrice(car.price) < 1500000
                ? '₹5,000 - 8,000 per service'
                : '₹8,000 - 15,000 per service',
        serviceInterval: 'Every 10,000 km or 12 months',
        verdict: `The ${car.name} is a solid choice in the ${(car.bodyType || '').toLowerCase()} segment. Priced at ${car.price}, it offers ${car.power || 'adequate'} power and ${car.torque || 'good'} torque. Research thoroughly and test drive before buying.`,
    };
});

// Merge: new cars first, then existing cars that don't conflict
const newIds = new Set(newCars.map(c => c.id));
const mergedCars = [
    ...newCars,
    ...existing.filter(c => !newIds.has(c.id)).map(c => ({
        ...c,
        year: c.year || 2020,
        serviceInterval: c.serviceInterval || 'Every 10,000 km or 12 months',
        verdict: c.verdict || `The ${c.name} is a ${(c.bodyType || '').split(',')[0].trim().toLowerCase()} by ${c.brand}. A solid choice in its segment.`,
    }))
];

// Sort by year desc, then name
mergedCars.sort((a, b) => (b.year || 0) - (a.year || 0) || a.name.localeCompare(b.name));

// Write to public/
fs.writeFileSync(
    '/Users/montero/Desktop/AW mark I/public/cars_full.json',
    JSON.stringify(mergedCars, null, 2)
);

console.log(`Written ${mergedCars.length} cars to public/cars_full.json`);
console.log(`New cars: ${newCars.length}, Existing kept: ${mergedCars.length - newCars.length}`);
console.log(`File size: ${(fs.statSync('/Users/montero/Desktop/AW mark I/public/cars_full.json').size / 1024).toFixed(1)} KB`);
