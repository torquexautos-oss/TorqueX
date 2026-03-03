/**
 * ═══════════════════════════════════════════════════════════════════
 *  TorqueX Data Backfill Script
 *  
 *  One-time migration that re-scrapes CarWale variant pages to fill
 *  missing specs (engine, power, torque, mileage, dimensions, safety,
 *  drivetrain, colors) and model images into the SQLite database.
 *
 *  Usage:  node server/backfill.js
 *  Resume: node server/backfill.js          (auto-skips populated rows)
 *  
 *  Rate limited: ~800ms between requests (~40 min for all variants)
 * ═══════════════════════════════════════════════════════════════════
 */
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'car_data.sqlite');
const DELAY_MS = 800;

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ── HTTP Headers (mimic browser) ─────────────────────────────────
function getHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    };
}

// ── Spec Extraction from Raw HTML (ported from Python scraper) ───
function extractSpecs(html) {
    const specs = {};

    // Engine displacement: "1199 cc", "1498 cc"
    let m = html.match(/([\d,.])\s*cc/i);
    if (m) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (val > 50 && val < 10000) specs.engine_displacement_cc = Math.round(val);
    }

    // Power: "105 bhp", "81.86bhp"
    m = html.match(/([\d,.])\s*bhp/i);
    if (m) specs.power_output = m[0].trim();

    // Torque: "115 Nm", "280Nm"
    m = html.match(/([\d,.])\s*nm/i);
    if (m) specs.torque = m[0].trim();

    // Mileage: "18.8 kmpl", "20.09 km/l"
    m = html.match(/([\d.])\s*(?:kmpl|km\/l)/i);
    if (m) {
        const val = parseFloat(m[1]);
        if (val > 3 && val < 60) specs.mileage_kmpl = val;
    }

    // Dimensions
    m = html.match(/(?:length)[^<>]{0,60}?([\d,]+)\s*mm/i);
    if (m) {
        const val = parseInt(m[1].replace(/,/g, ''));
        if (val > 2000 && val < 7000) specs.length_mm = val;
    }
    m = html.match(/(?:width)[^<>]{0,60}?([\d,]+)\s*mm/i);
    if (m) {
        const val = parseInt(m[1].replace(/,/g, ''));
        if (val > 1000 && val < 3000) specs.width_mm = val;
    }
    m = html.match(/(?:height)[^<>]{0,60}?([\d,]+)\s*mm/i);
    if (m) {
        const val = parseInt(m[1].replace(/,/g, ''));
        if (val > 1000 && val < 3000) specs.height_mm = val;
    }
    m = html.match(/(?:wheelbase)[^<>]{0,60}?([\d,]+)\s*mm/i);
    if (m) {
        const val = parseInt(m[1].replace(/,/g, ''));
        if (val > 1500 && val < 5000) specs.wheelbase_mm = val;
    }
    m = html.match(/(?:ground\s*clearance)[^<>]{0,60}?([\d,]+)\s*mm/i);
    if (m) {
        const val = parseInt(m[1].replace(/,/g, ''));
        if (val > 50 && val < 500) specs.ground_clearance_mm = val;
    }

    // Boot space: "350 litres", "415 L"
    m = html.match(/(?:boot\s*space|cargo\s*volume|boot\s*capacity)[^<>]{0,60}?([\d,.]+)\s*(?:litres?|l\b)/i);
    if (m) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (val > 30 && val < 3000) specs.boot_space_l = Math.round(val);
    }

    // Airbags: "6 airbags", "2 Airbags"
    m = html.match(/(\d+)\s*airbags?/i);
    if (m) {
        const val = parseInt(m[1]);
        if (val >= 1 && val <= 12) specs.airbags_count = val;
    }

    // ABS
    if (/\bABS\b/i.test(html) && /(?:yes|available|standard|✓)/i.test(html.substring(Math.max(0, html.search(/\bABS\b/i) - 100), html.search(/\bABS\b/i) + 100))) {
        specs.has_abs = 1;
    }

    // ADAS
    if (/\bADAS\b/i.test(html)) {
        specs.has_adas = 1;
    }

    // Sunroof
    if (/sunroof/i.test(html) && !/no\s*sunroof/i.test(html)) {
        specs.has_sunroof = 1;
    }

    // Drivetrain: FWD, RWD, AWD, 4WD
    m = html.match(/\b(FWD|RWD|AWD|4WD|Front[- ]Wheel|Rear[- ]Wheel|All[- ]Wheel)\b/i);
    if (m) {
        const raw = m[1].toUpperCase();
        if (raw.startsWith('FRONT')) specs.drivetrain = 'FWD';
        else if (raw.startsWith('REAR')) specs.drivetrain = 'RWD';
        else if (raw.startsWith('ALL') || raw === '4WD') specs.drivetrain = 'AWD';
        else specs.drivetrain = raw;
    }

    // Fuel type
    m = html.match(/(?:fuel\s*type)[^<>]{0,40}?(petrol|diesel|cng|electric|hybrid)/i);
    if (m) specs.fuel_type = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();

    // Battery (EV)
    m = html.match(/([\d.])\s*kwh/i);
    if (m) {
        const val = parseFloat(m[1]);
        if (val > 5 && val < 300) specs.battery_capacity_kwh = val;
    }

    // Range (EV)
    m = html.match(/(?:range)[^<>]{0,40}?([\d,]+)\s*km/i);
    if (m) {
        const val = parseInt(m[1].replace(/,/g, ''));
        if (val > 50 && val < 1500) specs.range_km = val;
    }

    return specs;
}

// ── Image Extraction ─────────────────────────────────────────────
function extractImage(html) {
    const $ = cheerio.load(html);
    let imageUrl = $('meta[property="og:image"]').attr('content')
        || $('meta[name="twitter:image"]').attr('content');

    if (!imageUrl) {
        $('img').each((i, el) => {
            const src = $(el).attr('src') || '';
            if (src.includes('aeplcdn.com') && !imageUrl) {
                imageUrl = src;
            }
        });
    }

    if (imageUrl) {
        // Use a good resolution
        imageUrl = imageUrl.replace(/\/\d+x\d+\//, '/600x337/');
        return imageUrl;
    }
    return null;
}

// ── Available Colors Extraction ──────────────────────────────────
// function extractColors(html) { ... already removed logic }

// ── Delay helper ─────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TorqueX Data Backfill');
    console.log('═══════════════════════════════════════════════════════════');

    // ── Step 0: Clean corrupt power_output values ────────────────
    const corrupted = db.prepare(`
        UPDATE specifications SET power_output = NULL 
        WHERE power_output LIKE 'Rs.%' OR power_output LIKE '%Lakh%' OR power_output LIKE '%Variant%'
    `).run();
    console.log(`\n🧹 Cleaned ${corrupted.changes} corrupt power_output rows\n`);

    // ── Step 1: Backfill variant specs ───────────────────────────
    const variants = db.prepare(`
        SELECT v.id, v.source_url, v.name as variant_name,
               m.name as model_name, b.name as brand,
               s.engine_displacement_cc, s.power_output, s.torque,
               s.mileage_kmpl, s.length_mm, s.ground_clearance_mm,
               s.wheelbase_mm, s.airbags_count, s.drivetrain,
               s.boot_space_l, s.available_colors
        FROM variants v
        JOIN models m ON v.model_id = m.id
        JOIN brands b ON m.brand_id = b.id
        LEFT JOIN specifications s ON s.variant_id = v.id
        WHERE v.source_url IS NOT NULL AND v.source_url != ''
        ORDER BY b.name, m.name
    `).all();

    // Count how many have missing data
    const needsBackfill = variants.filter(v =>
        !v.engine_displacement_cc || !v.power_output || !v.torque ||
        !v.mileage_kmpl || !v.length_mm || !v.ground_clearance_mm ||
        !v.wheelbase_mm || !v.airbags_count || !v.drivetrain || !v.boot_space_l
    );

    console.log(`📊 Total variants: ${variants.length}`);
    console.log(`🔍 Variants needing backfill: ${needsBackfill.length}`);
    console.log(`⏭️  Already complete: ${variants.length - needsBackfill.length}`);
    console.log(`\n⏱️  Estimated time: ~${Math.ceil(needsBackfill.length * DELAY_MS / 60000)} minutes\n`);

    const updateSpec = db.prepare(`
        UPDATE specifications SET
            engine_displacement_cc = COALESCE(engine_displacement_cc, ?),
            power_output = CASE 
                WHEN power_output IS NULL OR power_output LIKE 'Rs.%' THEN ? 
                ELSE power_output 
            END,
            torque = COALESCE(torque, ?),
            mileage_kmpl = COALESCE(mileage_kmpl, ?),
            length_mm = COALESCE(length_mm, ?),
            width_mm = COALESCE(width_mm, ?),
            height_mm = COALESCE(height_mm, ?),
            wheelbase_mm = COALESCE(wheelbase_mm, ?),
            ground_clearance_mm = COALESCE(ground_clearance_mm, ?),
            boot_space_l = COALESCE(boot_space_l, ?),
            airbags_count = COALESCE(airbags_count, ?),
            has_abs = COALESCE(has_abs, ?),
            has_adas = COALESCE(has_adas, ?),
            has_sunroof = COALESCE(has_sunroof, ?),
            drivetrain = COALESCE(drivetrain, ?),
            available_colors = COALESCE(available_colors, ?),
            battery_capacity_kwh = COALESCE(battery_capacity_kwh, ?),
            range_km = COALESCE(range_km, ?)
        WHERE variant_id = ?
    `);

    let specSuccess = 0, specFail = 0, specSkip = 0;

    for (let i = 0; i < needsBackfill.length; i++) {
        const v = needsBackfill[i];

        // Progress bar
        if (i % 25 === 0 || i === needsBackfill.length - 1) {
            const pct = ((i + 1) / needsBackfill.length * 100).toFixed(1);
            process.stdout.write(`\r  📦 Specs: ${i + 1}/${needsBackfill.length} (${pct}%) — ✅ ${specSuccess} | ❌ ${specFail} | ⏭️  ${specSkip}     `);
        }

        try {
            const res = await axios.get(v.source_url, {
                headers: getHeaders(),
                timeout: 15000,
                maxRedirects: 3,
            });

            const specs = extractSpecs(res.data);

            if (Object.keys(specs).length > 0) {
                updateSpec.run(
                    specs.engine_displacement_cc || null,
                    specs.power_output || null,
                    specs.torque || null,
                    specs.mileage_kmpl || null,
                    specs.length_mm || null,
                    specs.width_mm || null,
                    specs.height_mm || null,
                    specs.wheelbase_mm || null,
                    specs.ground_clearance_mm || null,
                    specs.boot_space_l || null,
                    specs.airbags_count || null,
                    specs.has_abs || null,
                    specs.has_adas || null,
                    specs.has_sunroof || null,
                    specs.drivetrain || null,
                    specs.available_colors || null,
                    specs.battery_capacity_kwh || null,
                    specs.range_km || null,
                    v.id
                );
                specSuccess++;
            } else {
                specSkip++;
            }
        } catch (err) {
            console.error(`[Error] Failed variant ${v.id}: ${err.message}`);
            specFail++; // Keep specFail count for reporting
        }
        await sleep(DELAY_MS);
    }
    console.log('\n');

    // ── Step 2: Backfill model images ────────────────────────────
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  IMAGE BACKFILL');
    console.log('═══════════════════════════════════════════════════════════\n');

    const models = db.prepare(`
        SELECT m.id, m.name, b.name as brand, m.image_url
        FROM models m JOIN brands b ON m.brand_id = b.id
        WHERE m.image_url IS NULL OR m.image_url = ''
    `).all();

    console.log(`📸 Models needing images: ${models.length}\n`);

    const updateImage = db.prepare('UPDATE models SET image_url = ? WHERE id = ?');
    let imgSuccess = 0, imgFail = 0;

    for (let i = 0; i < models.length; i++) {
        const m = models[i];

        if (i % 20 === 0 || i === models.length - 1) {
            const pct = ((i + 1) / models.length * 100).toFixed(1);
            process.stdout.write(`\r  📸 Images: ${i + 1}/${models.length} (${pct}%) — ✅ ${imgSuccess} | ❌ ${imgFail}     `);
        }

        // Derive CarWale model page URL
        const brandSlug = m.brand.toLowerCase().replace(/ /g, '-');
        let modelSlug = m.name.toLowerCase()
            .replace(new RegExp('^' + m.brand.toLowerCase() + '\\s*', 'i'), '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!modelSlug) modelSlug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const url = `https://www.carwale.com/${brandSlug}-cars/${modelSlug}/`;

        try {
            const res = await axios.get(url, {
                headers: getHeaders(),
                timeout: 15000,
                maxRedirects: 3,
            });

            const imageUrl = extractImage(res.data);

            if (imageUrl) {
                updateImage.run(imageUrl, m.id);
                imgSuccess++;
            } else {
                imgFail++;
            }
        } catch {
            specFail++;
        }

        await sleep(DELAY_MS);
    }
    console.log('\n');

    // ── Final Report ─────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  BACKFILL COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Specs: ${specSuccess} updated, ${specFail} failed, ${specSkip} empty responses`);
    console.log(`  Images: ${imgSuccess} found, ${imgFail} missing`);
    console.log('═══════════════════════════════════════════════════════════\n');

    db.close();
    process.exit(0);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Interrupted! Data saved so far is safe. Re-run to resume.');
    db.close();
    process.exit(0);
});

main().catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    db.close();
    process.exit(1);
});
