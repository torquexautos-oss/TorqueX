/**
 * Database module — wraps better-sqlite3 for TorqueX.
 * Provides read-only access to the cars database.
 */
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'torquex.db');

let db;
function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
    }
    return db;
}

// ══════════════════════════════════════════════════════════
// BRANDS
// ══════════════════════════════════════════════════════════
export function getAllBrands() {
    return getDb().prepare(`
        SELECT b.id, b.name, b.country, b.founded_year,
               COUNT(c.id) AS car_count
        FROM brands b
        LEFT JOIN cars c ON c.brand_id = b.id
        GROUP BY b.id
        ORDER BY b.name
    `).all();
}

// ══════════════════════════════════════════════════════════
// CARS — flat list (one row per car model with cheapest variant info)
// ══════════════════════════════════════════════════════════════
export function getAllCars() {
    const cars = getDb().prepare(`
        SELECT c.id, c.model_name, c.body_type, c.seating_capacity,
               c.ncap_rating, c.bncap_rating, c.price_min, c.price_max,
               c.ground_clearance_mm, c.boot_space_litres,
               c.fuel_tank_capacity, c.description,
               b.name AS brand_name
        FROM cars c
        JOIN brands b ON c.brand_id = b.id
        ORDER BY b.name, c.model_name
    `).all();

    // Attach variants + colors to each car
    const variantStmt = getDb().prepare(`SELECT * FROM variants WHERE car_id = ?`);
    const colorStmt = getDb().prepare(`SELECT * FROM colors WHERE car_id = ?`);

    return cars.map(car => {
        const variants = variantStmt.all(car.id);
        const colors = colorStmt.all(car.id);

        // Collect unique fuel types + transmissions from variants
        const fuelTypes = [...new Set(variants.map(v => v.fuel_type).filter(Boolean))];
        const transmissions = [...new Set(variants.map(v => v.transmission).filter(Boolean))];
        const cheapest = variants.length > 0
            ? variants.reduce((a, b) => a.price_lakh < b.price_lakh ? a : b)
            : null;

        return {
            // Core identity
            id: car.id,
            name: `${car.brand_name} ${car.model_name}`,
            modelName: car.model_name,
            brand: car.brand_name,
            bodyType: car.body_type,

            // Price (in rupees for compatibility with formatPrice)
            price: car.price_min ? car.price_min * 100000 : 0,
            priceRange: car.price_min && car.price_max
                ? `₹ ${car.price_min.toFixed(2)} Lakh - ₹ ${car.price_max.toFixed(2)} Lakh`
                : '',
            priceMin: car.price_min ? car.price_min * 100000 : 0,
            priceMax: car.price_max ? car.price_max * 100000 : 0,

            // Specs from cheapest variant
            fuelType: fuelTypes.join(' / ') || 'N/A',
            engine: cheapest ? `${cheapest.engine_cc} cc` : 'N/A',
            engineDetails: cheapest ? `${cheapest.engine_cc} cc (${cheapest.power_bhp}PS) ${cheapest.engine_type}` : 'N/A',
            power: cheapest ? `${cheapest.power_bhp}PS` : 'N/A',
            torque: cheapest ? `${cheapest.torque_nm}Nm` : 'N/A',
            mileage: cheapest ? String(cheapest.mileage_kmpl || '0') : '0',
            transmission: transmissions.join(' / ') || 'N/A',

            // Dimensions & capacity
            seatingCapacity: car.seating_capacity || 5,
            bootSpace: car.boot_space_litres ? `${car.boot_space_litres} litres` : 'N/A',
            groundClearance: car.ground_clearance_mm ? `${car.ground_clearance_mm} mm` : 'N/A',
            fuelTankCapacity: car.fuel_tank_capacity ? `${car.fuel_tank_capacity} litres` : 'N/A',

            // Content
            description: car.description || `The ${car.brand_name} ${car.model_name} is a ${car.body_type || 'vehicle'} available in India.`,
            emissionNorm: 'BS6',

            // Safety
            ncapRating: car.ncap_rating,
            bncapRating: car.bncap_rating,
            numAirbags: cheapest?.num_airbags || 0,

            // Images (placeholder — you can add image paths to DB later)
            images: [`/images/cars/${car.brand_name.toLowerCase()}-${car.model_name.toLowerCase().replace(/\s+/g, '-')}.svg`],

            // Variants (transformed)
            variants: variants.map(v => ({
                id: `${car.id}-v${v.id}`,
                variantId: v.id,
                name: `${car.brand_name} ${car.model_name} ${v.variant_name}`,
                label: v.variant_name,
                price: v.price_lakh * 100000,
                priceLakh: v.price_lakh,
                fuelType: v.fuel_type,
                transmission: v.transmission,
                engine: `${v.engine_cc} cc`,
                engineCc: v.engine_cc,
                engineType: v.engine_type,
                power: `${v.power_bhp}PS`,
                powerBhp: v.power_bhp,
                torque: `${v.torque_nm}Nm`,
                torqueNm: v.torque_nm,
                mileage: String(v.mileage_kmpl || '0'),
                mileageKmpl: v.mileage_kmpl,
                numAirbags: v.num_airbags,
                tyreSize: v.tyre_size,
            })),

            // Colors
            colors: colors.map(c => ({
                name: c.color_name,
                hex: c.hex_code,
            })),

            // Variant count
            variantCount: variants.length,

            // Empty arrays for fields that don't exist in DB yet
            pros: [],
            cons: [],
            commonProblems: [],
            maintenanceCostEstimate: 'Contact dealer for service costs',
        };
    });
}

// ══════════════════════════════════════════════════════════
// SINGLE CAR BY ID
// ══════════════════════════════════════════════════════════
export function getCarById(carId) {
    const allCars = getAllCars();
    return allCars.find(c => c.id === carId) || null;
}

// ══════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════
export function getStats() {
    const d = getDb();
    const brands = d.prepare('SELECT COUNT(*) AS c FROM brands').get().c;
    const cars = d.prepare('SELECT COUNT(*) AS c FROM cars').get().c;
    const variants = d.prepare('SELECT COUNT(*) AS c FROM variants').get().c;
    const bodyTypes = d.prepare('SELECT COUNT(DISTINCT body_type) AS c FROM cars WHERE body_type IS NOT NULL').get().c;
    const fuelTypes = d.prepare('SELECT COUNT(DISTINCT fuel_type) AS c FROM variants WHERE fuel_type IS NOT NULL').get().c;
    return { brands, cars, variants, bodyTypes, fuelTypes };
}
