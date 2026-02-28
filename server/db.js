import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Pointing to the new live scraper database
const dbPath = path.join(__dirname, 'data/car_data.sqlite');

let db;
try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log(`[DB] Connected to Live Scraper Database: ${dbPath}`);
} catch (e) {
    console.error(`[DB] Failed to connect: ${e.message}`);
}

// ── Shared Aggregation Template ────────────────────────────────
// The new scraper schema normalizes data into brands > models > variants > specs/prices.
// TorqueX expects a flattened "car" (model-level) representation. 
// We use GROUP BY on the model ID to aggregate variations.
// Prices in the scraper are absolute INR. TorqueX UI expects Lakhs (INR / 100,000).

const BaseCarSelect = `
    SELECT
        m.id, 
        m.name AS model_name, 
        c.name AS car_group,
        m.body_type, 
        m.image_url,
        b.name AS brand, 
        m.launch_year,
        m.status,
        'India' AS brand_country,
        MAX(s.seating_capacity) AS seating_capacity,
        MAX(s.ground_clearance_mm) AS ground_clearance_mm,
        MAX(s.boot_space_l) AS boot_space_litres,
        0 AS ncap_rating, 
        MAX(s.engine_displacement_cc) || ' cc' AS engine,
        MAX(s.mileage_kmpl) AS mileage,
        MAX(v.transmission_type) AS transmission_type,
        MAX(v.fuel_type) AS fuelType,
        'Official specifications and real-world performance metrics for ' || m.name || '.' AS description,
        MIN(p.on_road) / 100000.0 AS price_min,
        MAX(p.on_road) / 100000.0 AS price_max,
        COUNT(v.id) AS variant_count
    FROM models m
    JOIN brands b ON m.brand_id = b.id
    LEFT JOIN cars c ON m.car_id = c.id
    LEFT JOIN variants v ON v.model_id = m.id
    LEFT JOIN specifications s ON s.variant_id = v.id
    LEFT JOIN prices p ON p.variant_id = v.id
`;

// ── All Cars (list view) ───────────────────────────────────────
export const getAllCars = () => {
    return db.prepare(`
        ${BaseCarSelect}
        GROUP BY m.id
        ORDER BY b.name, m.name
    `).all();
};

// ── Single Car with Variants & Colors ──────────────────────────
export const getCarById = (id) => {
    const car = db.prepare(`
        ${BaseCarSelect}
        WHERE m.id = ?
        GROUP BY m.id
    `).get(id);

    if (!car) return null;

    const variants = db.prepare(`
        SELECT 
            v.id, 
            v.name AS variant_name, 
            v.transmission_type, 
            v.fuel_type, 
            v.source_url,
            s.engine_displacement_cc, 
            s.power_output, 
            s.torque, 
            s.mileage_kmpl,
            MIN(IFNULL(p.on_road, p.ex_showroom)) / 100000.0 AS price_lakh
        FROM variants v
        LEFT JOIN specifications s ON s.variant_id = v.id
        LEFT JOIN prices p ON p.variant_id = v.id
        WHERE v.model_id = ?
        GROUP BY v.id
        ORDER BY price_lakh ASC
    `).all(id);

    // Scraper doesn't extract color codes yet, returning empty array to avoid UI crash
    const colors = [];

    return { ...car, variants, colors };
};

// ── Car by Brand + Model Name ──────────────────────────────────
export const getCarByBrandAndModel = (brandName, modelName) => {
    const car = db.prepare(`
        SELECT m.id FROM models m
        JOIN brands b ON m.brand_id = b.id
        WHERE LOWER(b.name) = LOWER(?) AND LOWER(m.name) = LOWER(?)
    `).get(brandName, modelName);

    if (!car) return null;
    return getCarById(car.id);
};

// ── All Brands ─────────────────────────────────────────────────
export const getAllBrands = () => {
    return db.prepare(`
        SELECT b.id, b.name, COUNT(m.id) AS car_count
        FROM brands b
        LEFT JOIN models m ON m.brand_id = b.id
        GROUP BY b.id
        ORDER BY b.name
    `).all();
};

// ── Cars by Brand ──────────────────────────────────────────────
export const getCarsByBrand = (brandName) => {
    return db.prepare(`
        ${BaseCarSelect}
        WHERE LOWER(b.name) = LOWER(?)
        GROUP BY m.id
        ORDER BY price_min
    `).all(brandName);
};

// ── Search Cars ────────────────────────────────────────────────
export const searchCars = (query) => {
    const q = `%${query}%`;
    return db.prepare(`
        ${BaseCarSelect}
        WHERE m.name LIKE ? OR b.name LIKE ? OR m.body_type LIKE ?
        GROUP BY m.id
        ORDER BY b.name, m.name
    `).all(q, q, q);
};

// ── Cars by Body Type ──────────────────────────────────────────
export const getCarsByBodyType = (bodyType) => {
    const q = `%${bodyType}%`;
    return db.prepare(`
        ${BaseCarSelect}
        WHERE m.body_type LIKE ?
        GROUP BY m.id
        ORDER BY price_min
    `).all(q);
};

// ── Stats ──────────────────────────────────────────────────────
export const getStats = () => {
    const total = db.prepare('SELECT COUNT(*) AS count FROM models').get();
    const brands = db.prepare('SELECT COUNT(*) AS count FROM brands').get();
    const variants = db.prepare('SELECT COUNT(*) AS count FROM variants').get();
    const bodyTypes = db.prepare('SELECT DISTINCT body_type FROM models WHERE body_type IS NOT NULL').all();
    const evCount = db.prepare(`SELECT COUNT(*) AS count FROM variants WHERE LOWER(fuel_type) = 'electric'`).get();
    const priceRange = db.prepare('SELECT MIN(on_road)/100000.0 AS min, MAX(on_road)/100000.0 AS max FROM prices').get();

    return {
        totalCars: total.count,
        totalBrands: brands.count,
        totalVariants: variants.count,
        bodyTypes: bodyTypes.map(b => b.body_type),
        electricVariants: evCount.count,
        priceRange: { min: priceRange.min || 0, max: priceRange.max || 0 },
    };
};

// ── Compare Cars ───────────────────────────────────────────────
export const compareCars = (ids) => {
    return ids.map(id => getCarById(id)).filter(Boolean);
};

export { db };
