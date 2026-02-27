/**
 * Car data service — fetches from the TorqueX database API.
 * Provides a cache so the data is fetched only once per session.
 */

const API_BASE = 'http://localhost:3002';
let _cache = null;

export async function fetchAllCars() {
    if (_cache) return _cache;
    const res = await fetch(`${API_BASE}/api/cars`);
    if (!res.ok) throw new Error(`Failed to fetch cars: ${res.status}`);
    _cache = await res.json();
    return _cache;
}

export async function getCarById(id) {
    const cars = await fetchAllCars();

    // DB IDs are integers; route params may be strings like "3" or legacy slugs
    const numericId = parseInt(id);

    // Try direct ID match first
    const exactMatch = cars.find(c => c.id === numericId);
    if (exactMatch) {
        return { ...exactMatch, baseModel: exactMatch.modelName };
    }

    // Try matching by variant ID (e.g. "3-v12")
    for (const car of cars) {
        const variant = car.variants?.find(v => v.id === id);
        if (variant) {
            return {
                ...car,
                ...variant,
                baseModel: car.modelName,
                variants: car.variants,
            };
        }
    }

    return null;
}

export async function getUniqueBrands() {
    const cars = await fetchAllCars();
    return [...new Set(cars.map((car) => car.brand))].sort();
}

export async function getUniqueFuelTypes() {
    const cars = await fetchAllCars();
    const fuelTypes = new Set();
    cars.forEach((car) => {
        (car.fuelType || '').split('/').forEach((ft) => fuelTypes.add(ft.trim()));
    });
    return [...fuelTypes].filter(Boolean).sort();
}

export async function getUniqueBodyTypes() {
    const cars = await fetchAllCars();
    return [...new Set(cars.map((car) => car.bodyType).filter(Boolean))].sort();
}
