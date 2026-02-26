import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import NodeCache from 'node-cache';
import http from 'http';
import { scrapeCarData, loadImageCache, getImageMap, getCarImage, buildImageCache } from './scraper.js';
import { fetchMultipleChannels, fetchChannelFeed, getChannelList, CHANNELS, CHANNEL_CATEGORIES } from './rssParser.js';
import fs from 'fs';

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

    try {
        const content = description || title;
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a concise news editor. Write a clear 2-3 sentence summary of this article. Be factual and engaging. No filler."
                },
                {
                    role: "user",
                    content: `Summarize this article: "${title}"\n\n${content.substring(0, 1200)}`
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            max_completion_tokens: 150,
        });

        const summary = completion.choices[0]?.message?.content?.trim() || '';
        res.json({ summary, model: 'llama-3.1-8b-instant' });
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
    res.json(getImageMap());
});

app.get('/api/car/image', (req, res) => {
    const { modelId } = req.query;
    const img = getCarImage(modelId);
    res.json(img || { imageUrl: null, source: null });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        channelsAvailable: Object.keys(CHANNELS).length,
        cachedFeeds: feedCache.keys().length,
        imagesLoaded: Object.keys(getImageMap()).length,
    });
});

// ── Start ──────────────────────────────────────────────────────
loadImageCache();

const server = http.createServer(app);
server.listen(port, () => {
    console.log(`TorqueX Backend running on port ${port}`);
    console.log(`  News: Live channel system (${Object.keys(CHANNELS).length} channels, 0 AI cost)`);
    console.log(`  On-demand summaries: ${groq ? 'enabled' : 'disabled (no API key)'}`);

    // Start building image cache in background
    try {
        const carsData = JSON.parse(fs.readFileSync('public/cars_full.json', 'utf8'));
        setTimeout(() => {
            buildImageCache(carsData).catch(e => console.error('[ImageCache] Error:', e.message));
        }, 3000);
    } catch (e) {
        console.warn('[ImageCache] Could not load cars_full.json:', e.message);
    }
});

process.on('SIGTERM', () => { server.close(); });
process.on('SIGINT', () => { server.close(); });
setInterval(() => { }, 1 << 30);

