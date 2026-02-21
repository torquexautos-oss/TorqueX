import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_CACHE_FILE = path.join(__dirname, 'image-cache.json');

const getHeaders = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
});

// ── Load / Save Disk Cache ─────────────────────────────────────
let imageMap = {};

export const loadImageCache = () => {
    try {
        if (fs.existsSync(IMAGE_CACHE_FILE)) {
            imageMap = JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE, 'utf8'));
            console.log(`[ImageCache] Loaded ${Object.keys(imageMap).length} cached images from disk`);
        }
    } catch (e) {
        console.warn('[ImageCache] Could not read cache file:', e.message);
    }
};

const saveImageCache = () => {
    try {
        fs.writeFileSync(IMAGE_CACHE_FILE, JSON.stringify(imageMap, null, 2));
    } catch (e) {
        console.warn('[ImageCache] Could not write cache:', e.message);
    }
};

// ── Get Entire Image Map ───────────────────────────────────────
export const getImageMap = () => imageMap;

// ── Get Single Image (from cache or scrape) ────────────────────
export const getCarImage = (carId) => imageMap[carId] || null;

// ── Scrape Single Car Image from CarWale ───────────────────────
// Known slug overrides for models whose names don't match CarWale URLs
const SLUG_OVERRIDES = {
    'r wagon': 'wagon-r',
    'wagon r': 'wagon-r',
    's-presso': 's-presso',
    'grand i10 nios': 'grand-i10-nios',
    'eeco': 'eeco',
    'alto k10': 'alto-k10',
    'xl6': 'xl6',
    'fronx': 'fronx',
    'jimny': 'jimny',
    'invicto': 'invicto',
    'ertiga': 'ertiga',
    'ciaz': 'ciaz',
    'xc60': 'xc60',
    'xc90': 'xc90',
    's90': 's90',
    'c40 recharge': 'c40-recharge',
    'ex30': 'ex30',
    'ex90': 'ex90',
};

// Derive a CarWale-compatible model slug from the car name
const deriveModelSlug = (brand, name) => {
    let modelName = name;
    if (modelName.toLowerCase().startsWith(brand.toLowerCase())) {
        modelName = modelName.substring(brand.length).trim();
    }

    // Check overrides first
    const lowerModel = modelName.toLowerCase().trim();
    for (const [key, slug] of Object.entries(SLUG_OVERRIDES)) {
        if (lowerModel === key || lowerModel.startsWith(key + ' ')) {
            return slug;
        }
    }

    // Remove variant suffixes
    modelName = modelName.replace(/\s+(Base|Top|Luxury|Premium|LXi|VXi|ZXi|SX|VX|ZX|LX|EX|S|Plus|Pro|Max|Sport|Adventure|Turbo|MT|AT|AMT|CVT|DCT|iMT|HT|\d+\.\d+).*$/i, '');
    // Remove " Ev" suffix (keep as separate model on CarWale)
    modelName = modelName.replace(/\s+Ev$/i, '-ev');
    // Convert to slug
    return modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

const scrapeImage = async (brand, name) => {
    const brandSlug = brand.toLowerCase().replace(/ /g, '-');
    const modelSlug = deriveModelSlug(brand, name);
    if (!modelSlug) return null;

    const url = `https://www.carwale.com/${brandSlug}-cars/${modelSlug}/`;

    try {
        const res = await axios.get(url, {
            headers: getHeaders(),
            timeout: 10000,
            maxRedirects: 3
        });

        const $ = cheerio.load(res.data);
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
            imageUrl = imageUrl.replace(/\/\d+x\d+\//, '/600x337/');
            return { imageUrl, source: 'CarWale', sourceUrl: url };
        }
    } catch (e) {
        // Silent fail
    }
    return null;
};

// ── Background Builder ─────────────────────────────────────────
// Pre-fetches images for ALL cars in the background on server startup
let isBuilding = false;

export const buildImageCache = async (cars) => {
    if (isBuilding) return;
    isBuilding = true;

    const toFetch = cars.filter(c => !imageMap[c.id]);
    if (toFetch.length === 0) {
        console.log('[ImageCache] All images already cached');
        isBuilding = false;
        return;
    }

    console.log(`[ImageCache] Building cache for ${toFetch.length} cars (background)...`);
    let success = 0;
    let fail = 0;

    for (let i = 0; i < toFetch.length; i++) {
        const car = toFetch[i];
        try {
            const result = await scrapeImage(car.brand, car.name);
            if (result) {
                imageMap[car.id] = result;
                success++;
            } else {
                fail++;
            }
        } catch {
            fail++;
        }

        // Save every 20 cars
        if ((i + 1) % 20 === 0) {
            saveImageCache();
            console.log(`[ImageCache] Progress: ${i + 1}/${toFetch.length} (${success} ok, ${fail} miss)`);
        }

        // Rate limit: 500ms between requests
        await new Promise(r => setTimeout(r, 500));
    }

    saveImageCache();
    console.log(`[ImageCache] Done! ${success} images cached, ${fail} missing`);
    isBuilding = false;
};

// ── Exports for Scraper (price/specs) ──────────────────────────
export const scrapeCarData = async (brand, modelId, city) => {
    const defaultCity = city || 'delhi';
    const brandSlug = brand.toLowerCase().replace(/ /g, '-');
    const modelSlug = modelId.toLowerCase().replace(`${brandSlug}-`, '');

    const priceUrl = `https://www.carwale.com/${brandSlug}-cars/${modelSlug}/price-in-${defaultCity.toLowerCase().replace(/ /g, '-')}/`;
    const specsUrl = `https://www.carwale.com/${brandSlug}-cars/${modelSlug}/`;

    console.log(`[Scraper] Fetching: ${brand} ${modelId}`);

    try {
        const [priceRes, specsRes] = await Promise.allSettled([
            axios.get(priceUrl, { headers: getHeaders(), timeout: 10000 }),
            axios.get(specsUrl, { headers: getHeaders(), timeout: 10000 })
        ]);

        const resultData = {
            onRoadPrice: null,
            city: defaultCity,
            specs: {},
            sourceUrl: priceUrl,
            scrapedAt: new Date().toISOString()
        };

        if (priceRes.status === 'fulfilled') {
            const $ = cheerio.load(priceRes.value.data);
            $('*').each((i, el) => {
                const text = $(el).text();
                if (text.includes('₹') && (text.toLowerCase().includes('lakh') || text.toLowerCase().includes('crore'))) {
                    const match = text.match(/₹\s*[\d.]+\s*(Lakh|Crore)/i);
                    if (match && !resultData.onRoadPrice) {
                        resultData.onRoadPrice = match[0];
                    }
                }
            });
        }

        if (specsRes.status === 'fulfilled') {
            const $ = cheerio.load(specsRes.value.data);

            // Also grab image while we're at it
            if (!imageMap[modelId]) {
                const ogImg = $('meta[property="og:image"]').attr('content');
                if (ogImg) {
                    imageMap[modelId] = {
                        imageUrl: ogImg.replace(/\/\d+x\d+\//, '/600x337/'),
                        source: 'CarWale',
                        sourceUrl: specsUrl
                    };
                    saveImageCache();
                }
            }

            $('div').each((i, div) => {
                const text = $(div).text().trim();
                if (text === 'Engine' || text === 'Engine Displacement') {
                    const next = $(div).next().text().trim();
                    if (next) resultData.specs.engine = next;
                }
                if (text === 'Mileage' || text === 'ARAI Mileage') {
                    const next = $(div).next().text().trim();
                    if (next) resultData.specs.mileage = next;
                }
                if (text === 'Fuel Type') {
                    const next = $(div).next().text().trim();
                    if (next) resultData.specs.fuelType = next;
                }
                if (text === 'Transmission' || text === 'Transmission Type') {
                    const next = $(div).next().text().trim();
                    if (next && next.length < 30) resultData.specs.transmission = next;
                }
                if (text === 'Power') {
                    const next = $(div).next().text().trim();
                    if (next && next.length < 30) resultData.specs.power = next;
                }
            });
        }

        if (resultData.onRoadPrice || Object.keys(resultData.specs).length > 0) {
            return resultData;
        }
        return { error: 'Data not found', sourceUrl: priceUrl };
    } catch (e) {
        return { error: 'Failed to scrape', details: e.message };
    }
};
