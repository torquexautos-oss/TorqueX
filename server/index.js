import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import NodeCache from 'node-cache';
import { scrapeCarData, loadImageCache, getImageMap, getCarImage, buildImageCache } from './scraper.js';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Groq AI ────────────────────────────────────────────────────
const groqKey = process.env.GROQ_API_KEY;
if (!groqKey) {
    console.warn("[WARN] GROQ_API_KEY not set. AI features disabled.");
}
const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;

// ── News Cache ─────────────────────────────────────────────────
const newsCache = new NodeCache({ stdTTL: 86400 });

const TOPICS = [
    {
        title: "Upcoming Electric Vehicle Launches in India 2025",
        sections: [
            "Current state of the Indian EV market and government policies (FAME II, state subsidies)",
            "Tata Motors EV lineup expansion (Curvv EV, Harrier EV, Sierra EV)",
            "Mahindra Born Electric platform (XEV 9e, BE 6e specifications and pricing)",
            "Hyundai Creta EV and Kia EV6 market positioning",
            "Charging infrastructure development across metro and tier-2 cities",
            "Price comparison table of upcoming EVs vs current ICE counterparts"
        ],
        references: [
            { title: "Ministry of Heavy Industries - FAME India Scheme", url: "https://fame2.heavyindustries.gov.in/" },
            { title: "Society of Indian Automobile Manufacturers (SIAM)", url: "https://www.siam.in/" },
            { title: "Tata Motors Electric Vehicles", url: "https://cars.tatamotors.com/electric-cars" },
            { title: "Mahindra Born Electric", url: "https://www.mahindra.com/born-electric" }
        ]
    },
    {
        title: "Mahindra Thar Roxx: Comprehensive Review and Road Test",
        sections: [
            "Design evolution from Thar to Thar Roxx (exterior and interior changes)",
            "Engine options: 2.0L mStallion turbo-petrol and 2.2L mHawk diesel specifications",
            "4x4 drivetrain, terrain modes, and off-road capability assessment",
            "Ride quality, NVH levels, and highway cruising comfort",
            "Safety features (ADAS, airbags, ESP) and GNCAP rating expectations",
            "Pricing analysis across variants and value-for-money comparison with competitors"
        ],
        references: [
            { title: "Mahindra Thar Roxx Official Page", url: "https://www.mahindra.com/suv/thar-roxx" },
            { title: "Global NCAP Safety Ratings", url: "https://www.globalncap.org/" },
            { title: "ARAI Certified Fuel Efficiency Data", url: "https://www.araiindia.com/" }
        ]
    },
    {
        title: "Compact SUV Shootout: Tata Nexon vs Hyundai Venue vs Maruti Brezza",
        sections: [
            "Segment overview: Why compact SUVs dominate Indian car sales",
            "Tata Nexon: Engine specs, safety rating, and connected car features",
            "Hyundai Venue: Design philosophy, turbo DCT performance, and feature list",
            "Maruti Suzuki Brezza: Mild-hybrid technology, reliability, and after-sales network",
            "Head-to-head specification comparison table (dimensions, engine, features, price)",
            "Ownership costs: Insurance, maintenance, resale value analysis",
            "Final verdict and buyer recommendations by use case"
        ],
        references: [
            { title: "Tata Nexon Official", url: "https://cars.tatamotors.com/suv/nexon" },
            { title: "Hyundai Venue Official", url: "https://www.hyundai.com/in/en/find-a-car/venue" },
            { title: "Maruti Suzuki Brezza", url: "https://www.marutisuzuki.com/brezza" },
            { title: "Federation of Automobile Dealers Associations", url: "https://www.fada.in/" }
        ]
    },
    {
        title: "Best Fuel-Efficient Cars in India 2025: Hybrid and Mild-Hybrid Technology Deep Dive",
        sections: [
            "Understanding hybrid technology: Mild-hybrid, strong-hybrid, and plug-in hybrid explained",
            "Toyota Urban Cruiser Hyryder and Maruti Grand Vitara strong-hybrid systems",
            "Honda City e:HEV technology and real-world fuel efficiency",
            "Maruti Suzuki's Smart Hybrid technology across Swift, Baleno, and Brezza",
            "Cost-benefit analysis: Hybrid premium vs fuel savings over 5 years",
            "Government incentives and taxation differences for hybrid vehicles"
        ],
        references: [
            { title: "Toyota India - Hybrid Technology", url: "https://www.toyotabharat.com/hybrid/" },
            { title: "Honda India - e:HEV", url: "https://www.hondacarindia.com/" },
            { title: "Ministry of Road Transport - Fuel Norms", url: "https://morth.nic.in/" }
        ]
    },
    {
        title: "New Maruti Suzuki Swift 2025: Features, Performance and Market Impact",
        sections: [
            "Fourth-generation Swift design language and platform (HEARTECT)",
            "1.2L Z-Series DualJet engine: Specifications, power output, and efficiency",
            "Feature comparison: What's new vs the outgoing model",
            "Pricing strategy and variant-wise breakdown",
            "Competitive landscape: Swift vs i20 vs Baleno vs Glanza",
            "Initial ownership feedback and maintenance outlook"
        ],
        references: [
            { title: "Maruti Suzuki Swift Official", url: "https://www.marutisuzuki.com/swift" },
            { title: "Suzuki Global - HEARTECT Platform", url: "https://www.globalsuzuki.com/automobile/technology/" },
            { title: "Autocar India Review", url: "https://www.autocarindia.com/" }
        ]
    }
];

// Generate a Wikipedia-style article for a structured topic
const generateArticle = async (topicObj) => {
    if (!groq) throw new Error("Groq not configured");
    console.log(`[NewsGen] Generating: ${topicObj.title}`);

    const sectionPrompt = topicObj.sections.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const refList = topicObj.references.map(r => `- [${r.title}](${r.url})`).join('\n');

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are an expert automotive encyclopedia editor for TorqueX, a premium Indian automotive intelligence platform. Write comprehensive, deeply researched articles in the style of Wikipedia — neutral tone, factual, well-structured, and richly detailed. Format entirely in valid Markdown. Use ## for major sections, ### for subsections, **bold** for key terms, bullet points for lists, and include data tables using Markdown table syntax where appropriate. Do NOT use emojis. Every article should feel authoritative and complete.`
            },
            {
                role: "user",
                content: `Write a comprehensive encyclopedia-style article titled: "${topicObj.title}"

The article MUST include the following sections in order:
${sectionPrompt}

At the end of the article, include a "## References" section with these sources:
${refList}

Requirements:
- Each section should be at least 2-3 detailed paragraphs
- Include at least one Markdown data table with real specifications or comparison data
- Use precise figures (cc, PS, Nm, kmpl, lakhs) relevant to the Indian market
- Include "## Key Takeaways" as a bullet-point summary near the end
- Total article should be 1500-2500+ words
- Write as an impartial automotive journalist, not marketing copy`
            }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_completion_tokens: 4096,
    });

    const content = chatCompletion.choices[0]?.message?.content || "";
    return {
        id: Date.now().toString() + Math.floor(Math.random() * 1000),
        topic: topicObj.title,
        content,
        references: topicObj.references,
        wordCount: content.split(/\s+/).length,
        generatedAt: new Date().toISOString()
    };
};

// Build the full news feed
const buildNewsFeed = async () => {
    if (newsCache.get('feed')) return newsCache.get('feed');
    if (!groq) { console.warn("[NewsGen] Skipped — no API key"); return []; }

    console.log("[NewsGen] Building Wikipedia-style news feed...");
    const feed = [];
    for (const topic of TOPICS) {
        try {
            const article = await generateArticle(topic);
            feed.push(article);
            console.log(`[NewsGen] Done: ${topic.title} (${article.wordCount} words)`);
        } catch (e) {
            console.error(`[NewsGen] Failed: ${topic.title} —`, e.message);
        }
    }
    if (feed.length > 0) newsCache.set('feed', feed);
    return feed;
};

// ── API Endpoints ──────────────────────────────────────────────

app.get('/api/news', async (req, res) => {
    try {
        let feed = newsCache.get('feed');
        if (!feed || feed.length === 0) {
            buildNewsFeed();
            return res.status(202).json({
                message: 'AI is generating 5 in-depth articles. This takes about 60 seconds...',
                feed: []
            });
        }
        res.json({ feed });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/news/refresh', async (req, res) => {
    try {
        newsCache.del('feed');
        const feed = await buildNewsFeed();
        res.json({ success: true, feed });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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

// ── Image Map Endpoint (serves entire cache at once) ─────────
app.get('/api/images', (req, res) => {
    res.json(getImageMap());
});

// ── Single Image Lookup ──────────────────────────────────────
app.get('/api/car/image', (req, res) => {
    const { modelId } = req.query;
    const img = getCarImage(modelId);
    res.json(img || { imageUrl: null, source: null });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', newsReady: !!newsCache.get('feed'), imagesLoaded: Object.keys(getImageMap()).length });
});

// ── Start & Keep Alive ─────────────────────────────────────────
loadImageCache(); // Load disk cache immediately

const server = app.listen(port, () => {
    console.log(`TorqueX Backend running on port ${port}`);

    // Start building news feed
    buildNewsFeed().catch(e => console.error('[NewsGen] Startup error:', e.message));

    // Start building image cache in background
    try {
        const carsData = JSON.parse(fs.readFileSync('public/cars_full.json', 'utf8'));
        // Delay image building to let news finish first
        setTimeout(() => {
            buildImageCache(carsData).catch(e => console.error('[ImageCache] Error:', e.message));
        }, 5000);
    } catch (e) {
        console.warn('[ImageCache] Could not load cars_full.json:', e.message);
    }
});

process.on('SIGTERM', () => { server.close(); });
process.on('SIGINT', () => { server.close(); });
setInterval(() => { }, 1 << 30);
