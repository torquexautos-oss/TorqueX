import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import NodeCache from 'node-cache';
import http from 'http';
import * as cheerio from 'cheerio';
import parser from '@postlight/parser'; // Mercury Parser for full text
import { scrapeCarData, loadImageCache, getImageMap, getCarImage, buildImageCache } from './scraper.js';
import { fetchMultipleChannels, fetchChannelFeed, getChannelList, CHANNELS, CHANNEL_CATEGORIES } from './rssParser.js';
import { getAllCars, getCarById, getCarByBrandAndModel, getAllBrands, getCarsByBrand, searchCars, getCarsByBodyType, getStats, compareCars } from './db.js';
import recommendRouter from './routes/recommend.js';
import { startArticleSync } from './firestoreSync.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Groq AI (on-demand summaries only) ─────────────────────────
const groqKey = process.env.GROQ_API_KEY;
if (!groqKey) {
    console.warn("[WARN] GROQ_API_KEY not set. On-demand summaries disabled.");
}
const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;

// ── Feed Cache (15-minute TTL per channel — keeps it live) ─────
const feedCache = new NodeCache({ stdTTL: 900 }); // 15 minutes

// ── Full Article Cache (1 hour TTL) ────────────────────────────
const articleCache = new NodeCache({ stdTTL: 3600 });

// ── Browser-like headers to avoid bot detection ─────────────────
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Cache-Control': 'no-cache',
};

// ── Resolve redirect URLs (e.g. Google News) ─────────────────────
// Follows HTTP 3xx redirects manually (axios does this by default)
const resolveRedirect = async (url) => {
    try {
        const res = await axios.get(url, {
            headers: BROWSER_HEADERS,
            maxRedirects: 10,
            timeout: 10000,
            validateStatus: () => true, // Don't throw on 4xx/5xx
        });
        // After all redirects, the final URL is in res.request.res.responseUrl
        const finalUrl = res.request?.res?.responseUrl || res.config?.url || url;
        return { finalUrl, html: res.data, status: res.status };
    } catch (err) {
        return { finalUrl: url, html: null, status: 0 };
    }
};

// ── Layer 2: Cheerio DOM Extraction ──────────────────────────────
// Priority selector chain: tries the richest containers first
const ARTICLE_SELECTORS = [
    'article',
    '[class*="article-body"]', '[class*="articleBody"]',
    '[class*="article-content"]', '[class*="articleContent"]',
    '[class*="story-body"]', '[class*="story-content"]',
    '[class*="post-body"]', '[class*="post-content"]',
    '[class*="entry-content"]', '[class*="entry-body"]',
    '[itemprop="articleBody"]',
    '.content-wrapper', '.page-content',
    'main',
];

// Tags that are always noise
const NOISE_SELECTORS = [
    'script', 'style', 'noscript', 'iframe',
    'nav', 'header', 'footer', 'aside',
    '[class*="ad"]', '[class*="advertisement"]', '[class*="sidebar"]',
    '[class*="newsletter"]', '[class*="subscribe"]', '[class*="social"]',
    '[class*="related"]', '[class*="recommended"]', '[class*="more-articles"]',
    '[class*="comment"]', '[class*="share"]', '[class*="tags"]',
    '[id*="sidebar"]', '[id*="related"]', '[id*="ad"]',
];

const extractWithCheerio = (html) => {
    try {
        const $ = cheerio.load(html);

        // Remove all noise elements
        $(NOISE_SELECTORS.join(',')).remove();

        // Try each selector in priority order
        for (const sel of ARTICLE_SELECTORS) {
            const el = $(sel).first();
            if (el.length) {
                const text = el.text().trim();
                if (text.length > 250) {
                    return el.html(); // Return inner HTML (preserves paragraphs)
                }
            }
        }
        return null;
    } catch (e) {
        console.warn('[Cheerio] Error:', e.message);
        return null;
    }
};

// ── Full Article Extraction Endpoint ─────────────────────────────
// GET /api/article-content?url=...&rssContent=<encoded>
app.get('/api/article-content', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'URL is required' });

    // Decode optional RSS content fallback sent from the client
    const rssContent = req.query.rssContent
        ? decodeURIComponent(req.query.rssContent)
        : null;

    // Check cache first to avoid hammering publishers
    const cached = articleCache.get(targetUrl);
    if (cached) return res.json(cached);

    let finalUrl = targetUrl;
    let rawHtml = null;

    // ── Layer 1: Resolve redirects (critical for Google News URLs) ──
    console.log(`[Parser] Resolving: ${targetUrl}`);
    const resolved = await resolveRedirect(targetUrl);
    finalUrl = resolved.finalUrl || targetUrl;
    rawHtml = typeof resolved.html === 'string' ? resolved.html : null;
    console.log(`[Parser] Resolved to: ${finalUrl}`);

    // ── Layer 2: Cheerio extraction ─────────────────────────────────
    let content = null;
    let leadImage = null;

    if (rawHtml) {
        content = extractWithCheerio(rawHtml, finalUrl);
        if (content) {
            console.log(`[Parser] Cheerio extraction success (${content.length} chars)`);
        }
    }

    // ── Layer 3: Mercury Parser fallback ───────────────────────────
    if (!content || content.length < 250) {
        try {
            console.log(`[Parser] Trying Mercury on: ${finalUrl}`);
            const result = await parser.parse(finalUrl, {
                contentType: 'html',
                html: rawHtml || undefined,
            });
            if (result && result.content && result.content.length > 250) {
                content = result.content;
                leadImage = result.lead_image_url || null;
                console.log(`[Parser] Mercury success (${content.length} chars)`);
            }
        } catch (err) {
            console.warn(`[Parser] Mercury failed: ${err.message}`);
        }
    }

    // ── Layer 4: RSS fullContent passthrough ────────────────────────
    if ((!content || content.length < 250) && rssContent && rssContent.length > 100) {
        console.log(`[Parser] Using RSS fullContent fallback (${rssContent.length} chars)`);
        content = rssContent;
    }

    // ── Build response ──────────────────────────────────────────────
    if (content && content.length > 50) {
        // Extract lead image from rawHtml if not already found
        if (!leadImage && rawHtml) {
            const imgMatch = rawHtml.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
                || rawHtml.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
            if (imgMatch) leadImage = imgMatch[1];
        }

        const payload = { content, lead_image_url: leadImage, resolved_url: finalUrl };
        articleCache.set(targetUrl, payload);
        return res.json(payload);
    }

    // All layers failed
    console.error(`[Parser] All extraction layers failed for: ${targetUrl}`);
    res.status(500).json({ error: 'Could not extract article content from this publisher.' });
});

// ── Live Feed Endpoint ─────────────────────────────────────────
// GET /api/feed?channels=electrek,autocar-india&page=1&limit=20
app.get('/api/feed', async (req, res) => {
    try {
        const channelParam = req.query.channels || '';
        const channelIds = channelParam.split(',').filter(Boolean);

        if (channelIds.length === 0) {
            return res.status(400).json({ error: 'No channels specified. Use ?channels=electrek,autocar-india' });
        }

        // Check cache first (cache key = sorted channel IDs)
        const cacheKey = `feed_${[...channelIds].sort().join('_')}`;
        let articles = feedCache.get(cacheKey);

        if (!articles) {
            // Fetch live from RSS
            articles = await fetchMultipleChannels(channelIds);
            if (articles.length > 0) {
                feedCache.set(cacheKey, articles);
            }
        }

        // Filter by category if requested
        const category = req.query.category;
        let filtered = articles;
        if (category && category !== 'all') {
            filtered = articles.filter(a => a.category === category);
        }

        // Search
        const query = req.query.q;
        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q) ||
                a.source.toLowerCase().includes(q)
            );
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const start = (page - 1) * limit;
        const paginated = filtered.slice(start, start + limit);

        res.json({
            articles: paginated,
            total: filtered.length,
            page,
            totalPages: Math.ceil(filtered.length / limit),
            cachedAt: feedCache.getTtl(cacheKey) ? new Date(feedCache.getTtl(cacheKey) - 900000).toISOString() : null,
        });
    } catch (e) {
        console.error('[Feed] Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ── Channels Endpoint ──────────────────────────────────────────
// GET /api/channels — returns all available channels with metadata
app.get('/api/channels', (req, res) => {
    res.json({
        channels: getChannelList(),
        categories: CHANNEL_CATEGORIES,
    });
});

// ── On-Demand AI Summary ───────────────────────────────────────
// POST /api/summarize — generates a quick AI summary for an article
app.post('/api/summarize', async (req, res) => {
    if (!groq) {
        return res.status(503).json({ error: 'AI not configured. Set GROQ_API_KEY.' });
    }

    const { title, description, url } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Missing: title' });
    }

    // Cache key based on URL or title to prevent duplicate API calls
    const cacheKey = `summary_${url || title}`;
    const cachedSummary = feedCache.get(cacheKey);
    if (cachedSummary) {
        return res.json({ summary: cachedSummary, model: 'llama-3.1-8b-instant', cached: true });
    }

    try {
        const content = description || title;
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a concise news editor. Write a clear 2-3 sentence summary of this specific article. Be factual and engaging. No filler. Focus ONLY on the article provided."
                },
                {
                    role: "user",
                    content: `Please summarize this specific article: \nTitle: "${title}"\nContent: ${content.substring(0, 1200)}`
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            max_completion_tokens: 150,
        });

        const summary = completion.choices[0]?.message?.content?.trim() || '';

        // Cache the result for 24 hours
        if (summary) {
            feedCache.set(cacheKey, summary, 86400);
        }

        res.json({ summary, model: 'llama-3.1-8b-instant', cached: false });
    } catch (e) {
        if (e.status === 429) {
            return res.status(429).json({ error: 'Rate limited. Try again in a few seconds.' });
        }
        res.status(500).json({ error: e.message });
    }
});

// ── Car Scraper Endpoints (unchanged) ──────────────────────────

app.get('/api/car/scrape', async (req, res) => {
    try {
        const { brand, modelId, city } = req.query;
        if (!brand || !modelId) return res.status(400).json({ error: "Missing: brand, modelId" });
        const data = await scrapeCarData(brand, modelId, city);
        if (data.error) return res.status(500).json(data);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/images', (req, res) => {
    // Merge scraper cache with DB image_url values
    const scraperMap = getImageMap();
    const dbImages = getAllCars().reduce((map, car) => {
        if (car.image_url && !scraperMap[car.id]) {
            map[car.id] = { imageUrl: car.image_url, source: 'CarWale', sourceUrl: null };
        }
        return map;
    }, {});
    res.json({ ...dbImages, ...scraperMap });
});

app.get('/api/car/image', (req, res) => {
    const { modelId } = req.query;
    const img = getCarImage(modelId);
    if (img) return res.json(img);
    // Fallback: check DB image_url
    const car = getCarById(modelId);
    if (car && car.image_url) {
        return res.json({ imageUrl: car.image_url, source: 'CarWale' });
    }
    res.json({ imageUrl: null, source: null });
});

import { parseVibeQuery, generateVibePitch, generatePitchDeck } from './ai.js';

// ── Recommendation Engine ──────────────────────────────────────
app.use('/api/recommend', recommendRouter);

// ── Database API Endpoints ─────────────────────────────────────

// POST /api/pitch-deck — Generates spouse/family pitch
app.post('/api/pitch-deck', async (req, res) => {
    try {
        const { carName, specs } = req.body;
        if (!carName) return res.status(400).json({ error: 'carName is required' });

        const pitch = await generatePitchDeck(carName, specs);
        res.json(pitch);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/vibe-check — AI search
app.post('/api/vibe-check', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        const searchParams = await parseVibeQuery(query);
        let cars = getAllCars().filter(c => c.price_min && c.status !== 'Discontinued');

        // 1. Filter by Body Type (if specified)
        if (searchParams.body_type && searchParams.body_type !== 'Any') {
            const filtered = cars.filter(c => c.body_type && c.body_type.toLowerCase().includes(searchParams.body_type.toLowerCase()));
            if (filtered.length > 0) cars = filtered;
        }

        // 2. Comprehensive Scoring
        const budget = searchParams.budget || 99999999;
        const scoredCars = cars.map(car => {
            let score = 0;
            const carPrice = car.price_min * 100000;

            // Budget scoring (0-40 points) — closer to budget = better
            if (budget < 99999999) {
                const ratio = carPrice / budget;
                if (ratio <= 1.0) score += 40 - Math.round(Math.abs(1 - ratio) * 30);
                else if (ratio <= 1.15) score += 20;
                else if (ratio <= 1.3) score += 5;
                else score -= 30;
            }

            // Priority scoring (0-30 points)
            const p = searchParams.priority;
            if (p === 'Performance') {
                if (car.power_output) {
                    const bhp = parseFloat(car.power_output);
                    if (bhp > 150) score += 30;
                    else if (bhp > 100) score += 15;
                }
                if (['Coupe', 'Sedan'].includes(car.body_type)) score += 10;
            }
            if (p === 'Mileage') {
                if (car.mileage_kmpl) {
                    if (car.mileage_kmpl > 20) score += 30;
                    else if (car.mileage_kmpl > 15) score += 20;
                    else score += 5;
                }
            }
            if (p === 'Family') {
                if (['SUV', 'MUV', 'MPV', 'Minivan'].includes(car.body_type)) score += 25;
                if (car.airbags_count && car.airbags_count >= 6) score += 10;
                if (car.boot_space_l && car.boot_space_l > 400) score += 5;
            }
            if (p === 'Status') {
                if (carPrice > 3000000) score += 25;
                if (['Coupe', 'Convertible'].includes(car.body_type)) score += 10;
            }

            // Bonus for having more data (car appears more complete/premium)
            let dataBonus = 0;
            if (car.power_output) dataBonus += 2;
            if (car.mileage_kmpl) dataBonus += 2;
            if (car.airbags_count) dataBonus += 2;
            if (car.image_url) dataBonus += 3;
            score += dataBonus;

            // Normalize to percentage (0-100)
            const matchPct = Math.min(100, Math.max(5, Math.round((score / 80) * 100)));

            return { ...car, score, matchPct };
        });

        // 3. Find Top 3 Matches
        scoredCars.sort((a, b) => b.score - a.score);
        const topMatches = scoredCars.slice(0, 3);

        // 4. Generate Pitch for #1 match
        const pitch = await generateVibePitch(topMatches[0], query);

        res.json({
            matches: topMatches.map((car, i) => ({
                ...car,
                rank: i + 1,
            })),
            pitch,
            understoodParams: searchParams,
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/db/cars — all cars (list)
app.get('/api/db/cars', (req, res) => {
    try {
        const { q, type, brand } = req.query;
        let cars;
        if (q) cars = searchCars(q);
        else if (type) cars = getCarsByBodyType(type);
        else if (brand) cars = getCarsByBrand(brand);
        else cars = getAllCars();
        res.json({ cars, total: cars.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/db/cars/:id — single car with variants & colors
app.get('/api/db/cars/:id', (req, res) => {
    try {
        const car = getCarById(parseInt(req.params.id));
        if (!car) return res.status(404).json({ error: 'Car not found' });
        res.json(car);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/db/brands — all brands with car count
app.get('/api/db/brands', (req, res) => {
    try {
        res.json({ brands: getAllBrands() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/db/brands/:name/cars — all cars for a brand
app.get('/api/db/brands/:name/cars', (req, res) => {
    try {
        const cars = getCarsByBrand(req.params.name);
        res.json({ cars, total: cars.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/db/search?q=... — search cars
app.get('/api/db/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Missing: q' });
        const cars = searchCars(q);
        res.json({ cars, total: cars.length, query: q });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/db/stats — database stats
app.get('/api/db/stats', (req, res) => {
    try {
        res.json(getStats());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/db/compare — compare multiple cars
app.post('/api/db/compare', (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Missing: ids array' });
        const cars = compareCars(ids);
        res.json({ cars });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    let dbStats;
    try { dbStats = getStats(); } catch { dbStats = null; }
    res.json({
        status: 'ok',
        channelsAvailable: Object.keys(CHANNELS).length,
        cachedFeeds: feedCache.keys().length,
        imagesLoaded: Object.keys(getImageMap()).length,
        database: dbStats ? { connected: true, ...dbStats } : { connected: false },
    });
});

app.get('/api/debug', (req, res) => {
    try {
        const cwd = process.cwd();
        const dirName = __dirname;
        const exists = fs.existsSync(path.join(cwd, 'server', 'data', 'car_data.sqlite'));
        const exists2 = fs.existsSync(path.join(dirName, 'data', 'car_data.sqlite'));
        res.json({ cwd, dirName, exists, exists2 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Start ──────────────────────────────────────────────────────
loadImageCache();

// Start background Firestore article sync (runs on startup + every 15 min)
startArticleSync();

if (process.env.NODE_ENV !== 'production') {
    const server = http.createServer(app);
    server.listen(port, () => {
        console.log(`TorqueX Backend running on port ${port}`);
        console.log(`  News: Live channel system (${Object.keys(CHANNELS).length} channels, 0 AI cost)`);
        console.log(`  On-demand summaries: ${groq ? 'enabled' : 'disabled (no API key)'}`);
    });

    process.on('SIGTERM', () => { server.close(); });
    process.on('SIGINT', () => { server.close(); });
    setInterval(() => { }, 1 << 30);
}

export default app;
