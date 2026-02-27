import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'torquex.db');

let db;
try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log(`[DB] Connected to ${dbPath}`);
} catch (e) {
    console.error(`[DB] Failed to connect: ${e.message}`);
}

// ── Transform snake_case DB rows to camelCase for frontend ─────
const transformCar = (row) => ({
    id: row.id,
    modelId: row.id,
    name: row.model_name,
    modelName: row.model_name,
    bodyType: row.body_type,
    seatingCapacity: row.seating_capacity,
    ncapRating: row.ncap_rating,
    bncapRating: row.bncap_rating,
    priceMin: row.price_min,
    priceMax: row.price_max,
    price: row.price_min ? `₹ ${row.price_min} Lakh` : null,
    priceRange: row.price_min && row.price_max ? `₹ ${row.price_min} - ${row.price_max} Lakh` : null,
    groundClearance: row.ground_clearance_mm,
    bootSpace: row.boot_space_litres,
    fuelTankCapacity: row.fuel_tank_capacity,
    description: row.description,
    brand: row.brand,
    brandCountry: row.brand_country,
    // Pass through variant data if present
    ...(row.variants && { variants: row.variants }),
    ...(row.colors && { colors: row.colors }),
    // Variant-level fields (when returned from variant joins)
    ...(row.fuel_type && { fuelType: row.fuel_type }),
    ...(row.transmission && { transmission: row.transmission }),
    ...(row.engine_cc && { engine: `${row.engine_cc} cc` }),
    ...(row.mileage_kmpl && { mileage: `${row.mileage_kmpl} km/l` }),
});

// ── All Cars (list view) ───────────────────────────────────────
export const getAllCars = () => {
    return db.prepare(`
        SELECT
            c.id, c.model_name, c.body_type, c.seating_capacity,
            c.ncap_rating, c.bncap_rating,
            c.price_min, c.price_max,
            c.ground_clearance_mm, c.boot_space_litres, c.fuel_tank_capacity,
            c.description,
            b.name AS brand, b.country AS brand_country
        FROM cars c
        JOIN brands b ON c.brand_id = b.id
        ORDER BY b.name, c.model_name
    `).all().map(transformCar);
};

// ── Single Car with Variants & Colors ──────────────────────────
export const getCarById = (id) => {
    const car = db.prepare(`
        SELECT
            c.*, b.name AS brand, b.country AS brand_country, b.founded_year AS brand_founded
        FROM cars c
        JOIN brands b ON c.brand_id = b.id
        WHERE c.id = ?
    `).get(id);

    if (!car) return null;

    const variants = db.prepare(`
        SELECT * FROM variants WHERE car_id = ? ORDER BY price_lakh ASC
    `).all(id);

    const colors = db.prepare(`
        SELECT color_name, hex_code FROM colors WHERE car_id = ?
    `).all(id);

    return { ...transformCar(car), variants, colors };
};

// ── Car by Brand + Model Name ──────────────────────────────────
export const getCarByBrandAndModel = (brandName, modelName) => {
    const car = db.prepare(`
        SELECT c.id FROM cars c
        JOIN brands b ON c.brand_id = b.id
        WHERE LOWER(b.name) = LOWER(?) AND LOWER(c.model_name) = LOWER(?)
    `).get(brandName, modelName);

    if (!car) return null;
    return getCarById(car.id);
};

// ── All Brands ─────────────────────────────────────────────────
export const getAllBrands = () => {
    return db.prepare(`
        SELECT b.*, COUNT(c.id) AS car_count
        FROM brands b
        LEFT JOIN cars c ON c.brand_id = b.id
        GROUP BY b.id
        ORDER BY b.name
    `).all();
};

// ── Cars by Brand ──────────────────────────────────────────────
export const getCarsByBrand = (brandName) => {
    return db.prepare(`
        SELECT
            c.id, c.model_name, c.body_type, c.seating_capacity,
            c.ncap_rating, c.bncap_rating, c.price_min, c.price_max,
            c.ground_clearance_mm, c.boot_space_litres, c.description,
            b.name AS brand
        FROM cars c
        JOIN brands b ON c.brand_id = b.id
        WHERE LOWER(b.name) = LOWER(?)
        ORDER BY c.price_min
    `).all(brandName).map(transformCar);
};

// ── Search Cars ────────────────────────────────────────────────
export const searchCars = (query) => {
    const q = `%${query}%`;
    return db.prepare(`
        SELECT
            c.id, c.model_name, c.body_type, c.seating_capacity,
            c.ncap_rating, c.bncap_rating, c.price_min, c.price_max,
            c.ground_clearance_mm, c.boot_space_litres, c.description,
            b.name AS brand
        FROM cars c
        JOIN brands b ON c.brand_id = b.id
        WHERE c.model_name LIKE ? OR b.name LIKE ? OR c.body_type LIKE ? OR c.description LIKE ?
        ORDER BY b.name, c.model_name
    `).all(q, q, q, q).map(transformCar);
};

// ── Cars by Body Type ──────────────────────────────────────────
export const getCarsByBodyType = (bodyType) => {
    const q = `%${bodyType}%`;
    return db.prepare(`
        SELECT
            c.id, c.model_name, c.body_type, c.seating_capacity,
            c.ncap_rating, c.bncap_rating, c.price_min, c.price_max,
            c.ground_clearance_mm, c.boot_space_litres, c.description,
            b.name AS brand
        FROM cars c
        JOIN brands b ON c.brand_id = b.id
        WHERE c.body_type LIKE ?
        ORDER BY c.price_min
    `).all(q).map(transformCar);
};

// ── Stats ──────────────────────────────────────────────────────
export const getStats = () => {
    const total = db.prepare('SELECT COUNT(*) AS count FROM cars').get();
    const brands = db.prepare('SELECT COUNT(*) AS count FROM brands').get();
    const variants = db.prepare('SELECT COUNT(*) AS count FROM variants').get();
    const bodyTypes = db.prepare('SELECT DISTINCT body_type FROM cars').all();
    const evCount = db.prepare(`SELECT COUNT(*) AS count FROM variants WHERE fuel_type = 'EV'`).get();
    const priceRange = db.prepare('SELECT MIN(price_min) AS min, MAX(price_max) AS max FROM cars').get();

    return {
        totalCars: total.count,
        totalBrands: brands.count,
        totalVariants: variants.count,
        bodyTypes: bodyTypes.map(b => b.body_type),
        electricVariants: evCount.count,
        priceRange: { min: priceRange.min, max: priceRange.max },
    };
};

// ── Compare Cars ───────────────────────────────────────────────
export const compareCars = (ids) => {
    return ids.map(id => getCarById(id)).filter(Boolean);
};

export { db };
