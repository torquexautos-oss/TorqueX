/**
 * ═══════════════════════════════════════════════════════════════
 * SCORING ENGINE V2 — Intelligent Car Advisor
 * ═══════════════════════════════════════════════════════════════
 *
 * Changes from V1:
 * 1. Percentile rank normalization (replaces min-max) — immune to outliers
 * 2. Weighted harmonic mean + variance penalty (replaces linear average)
 * 3. Brand bonuses capped at +0.3, act as soft tiebreakers not drivers
 * 4. Dimension floor penalty — weak spots in high-priority dims punished
 * 5. Resale & Reliability use proxy data (age, segment, fuel, engine size)
 * 6. Score spread calibration — top 10 stretched to 4.0–9.5 range
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'car_data.sqlite');

let db;
try {
    db = new Database(dbPath, { readonly: true });
    db.pragma('journal_mode = WAL');
} catch (e) {
    console.error(`[ScoringEngine] DB connect failed: ${e.message}`);
}

// ═══════════════════════════════════════════════════════════════
// BRAND SOFT PRIORS — capped at +0.3 each (was up to +2.0 in V1)
// These act as tiebreakers, NOT score drivers.
// ═══════════════════════════════════════════════════════════════

const BRAND_PRIORS = {
    performance: {
        'Porsche': 0.30, 'BMW': 0.28, 'Audi': 0.28, 'Mercedes Benz': 0.25,
        'Jaguar': 0.25, 'Land Rover': 0.20, 'Volkswagen': 0.20, 'Skoda': 0.18,
        'Tata': 0.08, 'Mahindra': 0.08, 'Hyundai': 0.05, 'Kia': 0.05,
    },
    safety: {
        'Volvo': 0.30, 'Tata': 0.28, 'Mahindra': 0.22, 'Toyota': 0.18,
        'Volkswagen': 0.18, 'Skoda': 0.18, 'Hyundai': 0.12, 'Kia': 0.12,
        'Honda': 0.10, 'BMW': 0.15, 'Mercedes Benz': 0.15, 'Audi': 0.15,
        'Porsche': 0.20, 'Jeep': 0.12,
    },
    resale: {
        'Toyota': 0.30, 'Maruti Suzuki': 0.30, 'Mahindra': 0.25,
        'Honda': 0.18, 'Hyundai': 0.15, 'Tata': 0.10, 'Porsche': 0.15,
        'Kia': 0.08,
    },
    service: {
        'Maruti Suzuki': 0.30, 'Toyota': 0.25, 'Hyundai': 0.22,
        'Honda': 0.18, 'Tata': 0.15, 'Mahindra': 0.12, 'Kia': 0.10,
    },
    mileage: {
        'Maruti Suzuki': 0.28, 'Toyota': 0.12, 'Honda': 0.08,
        'Hyundai': 0.05,
    },
    reliability: {
        'Toyota': 0.30, 'Honda': 0.30, 'Maruti Suzuki': 0.28,
        'Mahindra': 0.20, 'Hyundai': 0.15, 'Tata': 0.12, 'Kia': 0.10,
        'Volkswagen': 0.08, 'Skoda': 0.08,
    },
};

// Body type base scores for fallbacks
const BODY_SAFETY_BASE = { 'SUV': 5.5, 'MUV': 5.0, 'MPV': 4.5, 'Sedan': 4.0, 'Hatchback': 3.2, 'Coupe': 3.8, 'Convertible': 2.8 };
const BODY_RESALE_BASE = { 'SUV': 5.5, 'Hatchback': 5.0, 'Sedan': 4.5, 'MPV': 3.8, 'MUV': 4.0 };
const BODY_RELIABILITY_BASE = { 'Hatchback': 5.8, 'Sedan': 5.5, 'SUV': 5.0, 'MPV': 5.0, 'MUV': 4.8 };

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function parseNumeric(val) {
    if (val == null) return null;
    if (typeof val === 'number') return val;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
}

function round(n, d = 2) {
    const f = Math.pow(10, d);
    return Math.round(n * f) / f;
}

function cap(val, lo = 0, hi = 10) {
    return Math.min(hi, Math.max(lo, val));
}

/**
 * PERCENTILE RANK NORMALIZATION
 * Each car gets its percentile position in the dataset → 0–10.
 * Immune to outliers. Naturally spreads scores across the full range.
 */
function percentileRanks(values) {
    // values: array of { index, value }
    const valid = values.filter(v => v.value != null).sort((a, b) => a.value - b.value);
    const n = valid.length;
    const ranks = new Map();
    valid.forEach((v, i) => {
        // Percentile position scaled to 0–10
        ranks.set(v.index, n > 1 ? (i / (n - 1)) * 10 : 5);
    });
    return ranks;
}

/**
 * WEIGHTED HARMONIC MEAN
 * Penalizes cars with low scores in any weighted dimension.
 * A car scoring 9/2 on two equally weighted dims gets ~3.6, not 5.5.
 *
 * Formula: H_w = (Σ w_i) / Σ(w_i / s_i)
 * We add a small epsilon to avoid division by zero.
 */
function weightedHarmonicMean(scores, weights) {
    const EPS = 0.2; // epsilon — prevents div-by-zero, softens extreme penalty
    let wSum = 0;
    let recipSum = 0;
    for (const [dim, weight] of Object.entries(weights)) {
        if (weight <= 0) continue;
        const s = Math.max(scores[dim], EPS);
        wSum += weight;
        recipSum += weight / s;
    }
    if (wSum === 0 || recipSum === 0) return 0;
    return wSum / recipSum;
}

/**
 * VARIANCE PENALTY
 * Subtracts a penalty proportional to score variance across weighted dims.
 * Rewards consistency. A car that's 7 across the board beats one that's 10/4.
 */
function variancePenalty(scores, weights) {
    const active = Object.entries(weights).filter(([, w]) => w > 0);
    if (active.length < 2) return 0;
    const totalW = active.reduce((s, [, w]) => s + w, 0);
    const wMean = active.reduce((s, [d, w]) => s + scores[d] * w, 0) / totalW;
    const wVar = active.reduce((s, [d, w]) => s + w * Math.pow(scores[d] - wMean, 2), 0) / totalW;
    // Penalty: sqrt(variance) * factor — capped at 1.5 points
    return Math.min(1.5, Math.sqrt(wVar) * 0.25);
}

// ═══════════════════════════════════════════════════════════════
// PRECOMPUTED CACHE — built once at startup
// ═══════════════════════════════════════════════════════════════

let _cache = null;

function getCache() {
    if (_cache) return _cache;
    if (!db) throw new Error('Database not connected');

    const rows = db.prepare(`
        SELECT
            m.id,
            m.name AS model_name,
            b.name AS brand,
            m.body_type,
            m.status,
            GROUP_CONCAT(DISTINCT v.fuel_type) AS fuel_types,
            MAX(v.fuel_type) AS fuel_type,
            MAX(s.engine_displacement_cc) AS engine_cc,
            MAX(s.power_output) AS power_output,
            MAX(s.torque) AS torque,
            MAX(s.mileage_kmpl) AS mileage_kmpl,
            MAX(s.airbags_count) AS airbags_count,
            MAX(s.has_adas) AS has_adas,
            MAX(s.has_abs) AS has_abs,
            MIN(p.on_road) / 100000.0 AS price_min,
            MAX(p.on_road) / 100000.0 AS price_max
        FROM models m
        JOIN brands b ON m.brand_id = b.id
        LEFT JOIN variants v ON v.model_id = m.id
        LEFT JOIN specifications s ON s.variant_id = v.id
        LEFT JOIN prices p ON p.variant_id = v.id
        GROUP BY m.id
        ORDER BY b.name, m.name
    `).all();

    // Pre-parse numerics
    const models = rows.map((m, idx) => ({
        ...m,
        _idx: idx,
        _power: parseNumeric(m.power_output),
        _torque: parseNumeric(m.torque),
        _engine: m.engine_cc || null,
        _mileage: m.mileage_kmpl || null,
        _fuels: (m.fuel_types || '').split(',').filter(Boolean).map(f => f.trim().toLowerCase()),
    }));

    // ── Precompute PERCENTILE RANKS for all numeric dimensions ──
    const powerRanks = percentileRanks(models.map(m => ({ index: m._idx, value: m._power })));
    const torqueRanks = percentileRanks(models.map(m => ({ index: m._idx, value: m._torque })));
    const engineRanks = percentileRanks(models.map(m => ({ index: m._idx, value: m._engine })));
    const mileageRanks = percentileRanks(models.map(m => ({ index: m._idx, value: m._mileage })));

    // Price range for filters
    const prices = models.map(p => p.price_min).filter(v => v != null && v > 0);
    const priceRange = {
        min: prices.length ? Math.floor(Math.min(...prices)) : 0,
        max: prices.length ? Math.ceil(Math.max(...prices)) : 500,
    };

    _cache = { models, powerRanks, torqueRanks, engineRanks, mileageRanks, priceRange };
    console.log(`[ScoringEngine V2] Cache built: ${models.length} models, percentile ranks precomputed`);
    return _cache;
}

// Build at startup
try { getCache(); } catch (e) { console.error('[ScoringEngine V2] Cache build failed:', e.message); }

// ═══════════════════════════════════════════════════════════════
// PROXY DATA SCORING (replaces pure brand lookups)
// ═══════════════════════════════════════════════════════════════

/**
 * RESALE PROXY
 * Factors: price segment + fuel type + body type + brand tiebreaker
 * - Budget cars (< ₹15L) hold value better in Indian market
 * - Petrol/CNG holds better than diesel post-BS6
 * - SUVs dominate resale in India
 */
function resaleProxy(car) {
    let score = BODY_RESALE_BASE[car.body_type] || 4.0;

    // Price segment factor
    const p = car.price_min;
    if (p != null) {
        if (p < 10) score += 1.5;       // Budget — strong resale
        else if (p < 20) score += 1.0;   // Mid — decent
        else if (p < 50) score += 0.3;   // Premium — moderate
        else score -= 0.5;               // Luxury — depreciates fast
    }

    // Fuel type factor (Indian market post-BS6)
    const fuels = car._fuels.join(' ');
    if (fuels.includes('petrol') || fuels.includes('cng')) score += 0.5;
    else if (fuels.includes('electric')) score += 0.3;
    else if (fuels.includes('diesel')) score -= 0.3;  // Diesel depreciates faster in urban India

    return cap(score);
}

/**
 * RELIABILITY PROXY
 * Factors: engine size bracket + fuel type + body type + brand tiebreaker
 * - Smaller engines = simpler = more reliable in Indian conditions
 * - Naturally aspirated petrol > turbo diesel for reliability
 */
function reliabilityProxy(car) {
    let score = BODY_RELIABILITY_BASE[car.body_type] || 4.5;

    // Engine size bracket (smaller = more reliable in Indian conditions)
    const cc = car._engine;
    if (cc != null) {
        if (cc < 1200) score += 1.8;        // Small, proven engines
        else if (cc < 1600) score += 1.2;    // Mid — still reliable
        else if (cc < 2000) score += 0.5;    // Larger — more complexity
        else if (cc < 3000) score -= 0.3;    // Big — more to go wrong
        else score -= 0.8;                   // Very large — specialist
    }

    // Fuel factor
    const fuels = car._fuels.join(' ');
    if (fuels.includes('petrol')) score += 0.5;  // NA petrol — proven
    else if (fuels.includes('cng')) score += 0.3;
    else if (fuels.includes('diesel')) score += 0.1;  // Modern diesels fine but complex
    else if (fuels.includes('electric')) score += 0.8; // Fewer moving parts

    return cap(score);
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export function getPriceRange() {
    return getCache().priceRange;
}

export function scoreAllCars(weights) {
    const {
        performanceWeight, safetyWeight, resaleWeight,
        serviceWeight, mileageWeight, reliabilityWeight,
        minPrice, maxPrice, fuelTypes,
    } = weights;

    const totalWeight = performanceWeight + safetyWeight + resaleWeight +
        serviceWeight + mileageWeight + reliabilityWeight;

    if (totalWeight === 0) {
        return { results: [], message: 'All weights are zero. Set at least one priority.', scoreMethod: 'v2' };
    }

    const { models, powerRanks, torqueRanks, engineRanks, mileageRanks } = getCache();
    let pool = models;

    // ── Price filter (BEFORE scoring) ──────────────────────────
    if (minPrice != null || maxPrice != null) {
        pool = pool.filter(m => {
            if (m.price_min == null) return false;
            if (minPrice != null && m.price_min < minPrice) return false;
            if (maxPrice != null && m.price_min > maxPrice) return false;
            return true;
        });
    }

    // ── Fuel type filter (BEFORE scoring) ──────────────────────
    if (fuelTypes && fuelTypes.length > 0) {
        const fuels = fuelTypes.map(f => f.toLowerCase());
        pool = pool.filter(m => {
            if (!m._fuels.length) return false;
            return m._fuels.some(f => fuels.some(sel => f.includes(sel) || sel.includes(f)));
        });
    }

    if (pool.length === 0) {
        return { results: [], error: 'No cars match your filters. Try widening your price range or fuel type.', scoreMethod: 'v2' };
    }

    // ── Weight map for harmonic mean ───────────────────────────
    const dimWeights = {
        performance: performanceWeight,
        safety: safetyWeight,
        resale: resaleWeight,
        service: serviceWeight,
        mileage: mileageWeight,
        reliability: reliabilityWeight,
    };

    // ── Score each car ─────────────────────────────────────────
    const scored = pool.map(car => {
        const idx = car._idx;

        // ┌─────────────────────────────────────────────────────┐
        // │ 1. PERFORMANCE — percentile-ranked composite        │
        // │    Power (45%), Torque (35%), Engine CC (20%)        │
        // └─────────────────────────────────────────────────────┘
        const pPerc = powerRanks.get(idx) ?? 0;
        const tPerc = torqueRanks.get(idx) ?? 0;
        const ePerc = engineRanks.get(idx) ?? 0;
        // Confidence: if data exists, use full score; if not, apply 0.85 multiplier
        const perfDataConf = (car._power != null ? 1 : 0.85);
        let performance = (pPerc * 0.45 + tPerc * 0.35 + ePerc * 0.20) * perfDataConf;
        performance = cap(performance + (BRAND_PRIORS.performance[car.brand] || 0));

        // ┌─────────────────────────────────────────────────────┐
        // │ 2. SAFETY — data-driven + body type fallback        │
        // └─────────────────────────────────────────────────────┘
        let safety;
        if (car.airbags_count != null && car.airbags_count > 0) {
            safety = Math.min(8.5, car.airbags_count * 1.1);
            if (car.has_adas) safety += 1.0;
            if (car.has_abs) safety += 0.4;
        } else {
            // Fallback — body type base, apply 0.85 confidence
            safety = (BODY_SAFETY_BASE[car.body_type] || 3.5) * 0.85;
            if (car.has_adas) safety += 0.8;
            if (car.has_abs) safety += 0.3;
        }
        safety = cap(safety + (BRAND_PRIORS.safety[car.brand] || 0));

        // ┌─────────────────────────────────────────────────────┐
        // │ 3. RESALE — proxy data scoring (not pure brand)     │
        // │    Factors: price segment, fuel type, body type     │
        // └─────────────────────────────────────────────────────┘
        let resale = resaleProxy(car);
        resale = cap(resale + (BRAND_PRIORS.resale[car.brand] || 0));

        // ┌─────────────────────────────────────────────────────┐
        // │ 4. SERVICE — base + brand tiebreaker                │
        // │    (No proxy data available — brand is the signal)  │
        // └─────────────────────────────────────────────────────┘
        let service = 4.5; // base for all brands
        service = cap(service + (BRAND_PRIORS.service[car.brand] || 0));

        // ┌─────────────────────────────────────────────────────┐
        // │ 5. MILEAGE — percentile ranked + fuel bonus         │
        // └─────────────────────────────────────────────────────┘
        let mileage;
        if (car._mileage != null) {
            mileage = mileageRanks.get(idx) ?? 0;
        } else if (car._fuels.some(f => f.includes('electric'))) {
            mileage = 7.5; // EVs — high efficiency, no mileage_kmpl data
        } else {
            mileage = 3.0 * 0.85; // No data — low confidence fallback
        }
        mileage = cap(mileage + (BRAND_PRIORS.mileage[car.brand] || 0));

        // ┌─────────────────────────────────────────────────────┐
        // │ 6. RELIABILITY — proxy data scoring (not pure brand)│
        // │    Factors: engine size, fuel type, body type       │
        // └─────────────────────────────────────────────────────┘
        let reliability = reliabilityProxy(car);
        reliability = cap(reliability + (BRAND_PRIORS.reliability[car.brand] || 0));

        const dimScores = {
            performance: round(performance),
            safety: round(safety),
            resale: round(resale),
            service: round(service),
            mileage: round(mileage),
            reliability: round(reliability),
        };

        // ┌─────────────────────────────────────────────────────┐
        // │ AGGREGATION: Weighted Harmonic Mean                 │
        // │ Penalizes weak dimensions even if others are strong │
        // │ A 9P/2S car scores ~3.6, not 5.5 on equal weights  │
        // └─────────────────────────────────────────────────────┘
        let rawScore = weightedHarmonicMean(dimScores, dimWeights);

        // ┌─────────────────────────────────────────────────────┐
        // │ VARIANCE PENALTY                                    │
        // │ Subtract up to 1.5 pts for inconsistent scores     │
        // │ Rewards balanced cars                               │
        // └─────────────────────────────────────────────────────┘
        rawScore -= variancePenalty(dimScores, dimWeights);

        // ┌─────────────────────────────────────────────────────┐
        // │ DIMENSION FLOOR PENALTY                             │
        // │ If user weights dim > 60 but car scores < 4 in it, │
        // │ apply 0.75 multiplier — don't recommend weak spots  │
        // └─────────────────────────────────────────────────────┘
        for (const [dim, weight] of Object.entries(dimWeights)) {
            if (weight > 60 && dimScores[dim] < 4) {
                rawScore *= 0.75;
                break; // Only apply once
            }
        }

        rawScore = Math.max(0, rawScore);

        return {
            id: car.id,
            name: car.model_name,
            brand: car.brand,
            bodyType: car.body_type,
            price_min: car.price_min ? round(car.price_min) : null,
            fuel: car.fuel_type || 'N/A',
            status: car.status,
            _rawScore: rawScore,
            scoreBreakdown: dimScores,
        };
    });

    // Sort by raw score descending
    scored.sort((a, b) => b._rawScore - a._rawScore);

    // Take top 10
    const top10 = scored.slice(0, 10);

    // ┌─────────────────────────────────────────────────────────┐
    // │ SCORE SPREAD CALIBRATION                                │
    // │ Stretch top 10 to span 4.0–9.5 so results feel diverse │
    // │ calibrated = 4 + ((raw - minRaw) / (maxRaw - minRaw))  │
    // │              × 5.5                                      │
    // └─────────────────────────────────────────────────────────┘
    if (top10.length > 1) {
        const rawScores = top10.map(c => c._rawScore);
        const minRaw = Math.min(...rawScores);
        const maxRaw = Math.max(...rawScores);
        const range = maxRaw - minRaw;

        top10.forEach(car => {
            if (range > 0.01) {
                car.finalScore = round(4.0 + ((car._rawScore - minRaw) / range) * 5.5);
            } else {
                car.finalScore = round(car._rawScore);
            }
            delete car._rawScore;
        });
    } else if (top10.length === 1) {
        top10[0].finalScore = round(top10[0]._rawScore);
        delete top10[0]._rawScore;
    }

    return { results: top10, scoreMethod: 'v2' };
}
