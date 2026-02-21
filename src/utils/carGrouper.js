/**
 * Groups individual car variants into unified model entries.
 * e.g., "Jeep Compass Base", "Jeep Compass Sport", "Jeep Compass Luxury"
 *       → one "Jeep Compass" with 3 variants.
 */

// Variant suffixes to strip for grouping
const VARIANT_SUFFIX = /\s+(Base|Top|Luxury|Premium|LXi|VXi|ZXi|SX|VX|ZX|LX|EX|S|Plus|Pro|Max|Sport|Adventure|Turbo|MT|AT|AMT|CVT|DCT|iMT|HT)$/i;

/**
 * Derives the base model name by stripping known variant suffixes.
 */
export function getBaseModelName(carName) {
    return carName.replace(VARIANT_SUFFIX, '').trim();
}

/**
 * Extracts the variant label from a car name (the suffix that was stripped).
 */
export function getVariantLabel(carName, baseModel) {
    const suffix = carName.substring(baseModel.length).trim();
    return suffix || 'Standard';
}

/**
 * Groups an array of cars into model groups.
 * Returns an array of model objects, sorted by lowest price.
 *
 * Each model object:
 * {
 *   baseModel: "Hyundai Creta",
 *   slug: "hyundai-creta" (derived from base model),
 *   brand: "Hyundai",
 *   bodyType: "SUV",
 *   fuelType: "Petrol / Diesel",
 *   engine: "1497 cc",
 *   mileage: "16.8",
 *   priceMin: 1099000,
 *   priceMax: 1999000,
 *   variantCount: 5,
 *   variants: [ { id, name, label, price, ... }, ... ],
 *   representative: { ...car }  // The "default" variant (usually the cheapest)
 * }
 */
export function groupCarsByModel(cars) {
    const groups = {};

    cars.forEach(car => {
        const baseModel = getBaseModelName(car.name);
        if (!groups[baseModel]) {
            groups[baseModel] = {
                baseModel,
                brand: car.brand,
                bodyType: car.bodyType,
                variants: []
            };
        }
        groups[baseModel].variants.push({
            ...car,
            label: getVariantLabel(car.name, baseModel)
        });
    });

    // Process each group into a clean model entry
    return Object.values(groups).map(group => {
        const variants = group.variants.sort((a, b) => a.price - b.price);
        const cheapest = variants[0];
        const mostExpensive = variants[variants.length - 1];

        // Slug derived from base model name
        const slug = group.baseModel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');

        // Collect all unique fuel types and transmissions
        const fuelTypes = [...new Set(variants.map(v => v.fuelType).filter(Boolean))];
        const engines = [...new Set(variants.map(v => v.engine).filter(Boolean))];

        return {
            // Identity
            baseModel: group.baseModel,
            slug,
            brand: group.brand,
            bodyType: group.bodyType,

            // Price range
            priceMin: cheapest.price,
            priceMax: mostExpensive.price,
            priceRange: cheapest.priceRange || `₹ ${formatLakh(cheapest.price)} - ₹ ${formatLakh(mostExpensive.price)}`,

            // Specs (use cheapest variant as representative)
            fuelType: fuelTypes.join(' / '),
            engine: engines[0] || 'N/A',
            mileage: cheapest.mileage,
            transmission: cheapest.transmission,

            // Variant info
            variantCount: variants.length,
            variants,

            // Representative car (cheapest) — used for image lookups, etc.
            representative: cheapest,

            // Keep original fields for compatibility
            id: cheapest.id,
            name: group.baseModel,
            price: cheapest.price,
            images: cheapest.images,
            description: cheapest.description,
            pros: cheapest.pros,
            cons: cheapest.cons,
            commonProblems: cheapest.commonProblems,
            maintenanceCostEstimate: cheapest.maintenanceCostEstimate,
            seatingCapacity: cheapest.seatingCapacity,
            bootSpace: cheapest.bootSpace,
            groundClearance: cheapest.groundClearance,
            fuelTankCapacity: cheapest.fuelTankCapacity,
            emissionNorm: cheapest.emissionNorm,
        };
    }).sort((a, b) => a.priceMin - b.priceMin);
}

function formatLakh(price) {
    if (price >= 10000000) return (price / 10000000).toFixed(2) + ' Crore';
    if (price >= 100000) return (price / 100000).toFixed(2) + ' Lakh';
    return price.toLocaleString('en-IN');
}
