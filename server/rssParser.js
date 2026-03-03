import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { createHash } from 'crypto';

// ── Stable unique ID from full URL (avoids prefix-collision) ──
// Uses SHA-256 truncated to 12 hex chars → 48-bit space (no padding, URL-safe)
const makeArticleId = (channelId, url) => {
    const hash = createHash('sha256').update(url).digest('hex').substring(0, 12);
    return `${channelId}_${hash}`;
};

// ── Favicon helper ─────────────────────────────────────────────
const getFavicon = (urlOrDomain, size = 32) => {
    try {
        const domain = urlOrDomain.replace(/^https?:\/\//, '').split('/')[0];
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    } catch { return null; }
};

// ── Channel Definitions ────────────────────────────────────────
// Each channel is a subscribable news source with metadata
export const CHANNELS = {
    'autocar-india': {
        id: 'autocar-india',
        name: 'Autocar India',
        description: 'India\'s leading automotive magazine — reviews, launches, and road tests',
        icon: getFavicon('www.autocarindia.com'),
        color: '#e74c3c',
        category: 'indian',
        feedUrl: 'https://www.autocarindia.com/RSS/rss.ashx',
        website: 'https://www.autocarindia.com',
    },
    'google-auto': {
        id: 'google-auto',
        name: 'Auto News',
        description: 'Breaking automotive news aggregated from hundreds of global publications',
        icon: getFavicon('news.google.com'),
        color: '#4285f4',
        category: 'industry',
        feedUrl: 'https://news.google.com/rss/search?q=automotive+cars+when:3d&hl=en-IN&gl=IN&ceid=IN:en',
        website: 'https://news.google.com',
    },
    'google-ev': {
        id: 'google-ev',
        name: 'EV News',
        description: 'Electric vehicle news, launches, battery tech, and charging infrastructure',
        icon: getFavicon('news.google.com'),
        color: '#0f9d58',
        category: 'evs',
        feedUrl: 'https://news.google.com/rss/search?q=electric+vehicles+EV+when:3d&hl=en-IN&gl=IN&ceid=IN:en',
        website: 'https://news.google.com',
    },
    'google-india': {
        id: 'google-india',
        name: 'India Auto',
        description: 'Indian car market news — Tata, Mahindra, Maruti, Hyundai, and more',
        icon: getFavicon('news.google.com'),
        color: '#ff9933',
        category: 'indian',
        feedUrl: 'https://news.google.com/rss/search?q=India+car+launch+Tata+Mahindra+Maruti+when:3d&hl=en-IN&gl=IN&ceid=IN:en',
        website: 'https://news.google.com',
    },
    'google-f1': {
        id: 'google-f1',
        name: 'Motorsport',
        description: 'Formula 1, MotoGP, WRC, NASCAR — race results and team news',
        icon: getFavicon('news.google.com'),
        color: '#e10600',
        category: 'motorsport',
        feedUrl: 'https://news.google.com/rss/search?q=Formula+1+MotoGP+motorsport+when:3d&hl=en&gl=US&ceid=US:en',
        website: 'https://news.google.com',
    },
    'google-policy': {
        id: 'google-policy',
        name: 'Auto Policy',
        description: 'Tariffs, regulations, emission standards, and government policy',
        icon: getFavicon('news.google.com'),
        color: '#f4b400',
        category: 'policy',
        feedUrl: 'https://news.google.com/rss/search?q=auto+tariffs+car+regulations+emission+when:7d&hl=en&gl=US&ceid=US:en',
        website: 'https://news.google.com',
    },
    'electrek': {
        id: 'electrek',
        name: 'Electrek',
        description: 'The premier source for Tesla, EV, and clean energy news',
        icon: getFavicon('electrek.co'),
        color: '#00b300',
        category: 'evs',
        feedUrl: 'https://electrek.co/feed/',
        website: 'https://electrek.co',
    },
    'insideevs': {
        id: 'insideevs',
        name: 'InsideEVs',
        description: 'EV reviews, comparisons, sales data, and market analysis',
        icon: getFavicon('insideevs.com'),
        color: '#1a73e8',
        category: 'evs',
        feedUrl: 'https://insideevs.com/rss/news/all/',
        website: 'https://insideevs.com',
    },
    'techcrunch': {
        id: 'techcrunch',
        name: 'TechCrunch Transport',
        description: 'Autonomous driving, mobility startups, and transportation technology',
        icon: getFavicon('techcrunch.com'),
        color: '#0a9e4d',
        category: 'tech',
        feedUrl: 'https://techcrunch.com/category/transportation/feed/',
        website: 'https://techcrunch.com',
    },
    'ars-cars': {
        id: 'ars-cars',
        name: 'Ars Technica Cars',
        description: 'In-depth automotive technology reporting and EV deep dives',
        icon: getFavicon('arstechnica.com'),
        color: '#ff6600',
        category: 'tech',
        feedUrl: 'https://arstechnica.com/cars/feed/',
        website: 'https://arstechnica.com',
    },
    'carscoops': {
        id: 'carscoops',
        name: 'CarScoops',
        description: 'Spy shots, scoops, new reveals, and global car news',
        icon: getFavicon('www.carscoops.com'),
        color: '#2196f3',
        category: 'launches',
        feedUrl: 'https://www.carscoops.com/feed/',
        website: 'https://www.carscoops.com',
    },
    'the-drive': {
        id: 'the-drive',
        name: 'The Drive',
        description: 'Car culture, reviews, military vehicles, and automotive lifestyle',
        icon: getFavicon('www.thedrive.com'),
        color: '#333333',
        category: 'reviews',
        feedUrl: 'https://www.thedrive.com/feed',
        website: 'https://www.thedrive.com',
    },
    'reddit-cars': {
        id: 'reddit-cars',
        name: 'r/cars',
        description: 'Reddit\'s largest car community — trending discussions and news',
        icon: getFavicon('www.reddit.com'),
        color: '#ff4500',
        category: 'community',
        feedUrl: 'https://www.reddit.com/r/cars/hot/.rss',
        website: 'https://www.reddit.com/r/cars',
    },
    'reddit-india': {
        id: 'reddit-india',
        name: 'r/CarsIndia',
        description: 'India\'s Reddit car community — ownership reviews and advice',
        icon: getFavicon('www.reddit.com'),
        color: '#ff4500',
        category: 'community',
        feedUrl: 'https://www.reddit.com/r/CarsIndia/hot/.rss',
        website: 'https://www.reddit.com/r/CarsIndia',
    },
    'reddit-ev': {
        id: 'reddit-ev',
        name: 'r/electricvehicles',
        description: 'EV owner community — real-world experiences and advice',
        icon: getFavicon('www.reddit.com'),
        color: '#ff4500',
        category: 'community',
        feedUrl: 'https://www.reddit.com/r/electricvehicles/hot/.rss',
        website: 'https://www.reddit.com/r/electricvehicles',
    },
};

// Category groupings for the channel discovery UI
export const CHANNEL_CATEGORIES = [
    { id: 'indian', label: 'India' },
    { id: 'evs', label: 'EVs & Hybrids' },
    { id: 'industry', label: 'Industry' },
    { id: 'motorsport', label: 'Motorsport' },
    { id: 'policy', label: 'Policy' },
    { id: 'tech', label: 'Tech' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'launches', label: 'Launches' },
    { id: 'community', label: 'Community' },
];

// ── Helpers ────────────────────────────────────────────────────
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

const stripHtml = (html) => {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const extractImageFromHtml = (html) => {
    if (!html || typeof html !== 'string') return null;
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
};

// ── Parse a Single Feed ────────────────────────────────────────
const parseFeed = async (channel) => {
    try {
        const res = await axios.get(channel.feedUrl, {
            headers: HEADERS,
            timeout: 12000,
            maxRedirects: 5,
            responseType: 'text',
        });

        const parsed = await parseStringPromise(res.data, {
            explicitArray: false,
            ignoreAttrs: false,
            trim: true,
        });

        const entries = [];

        // RSS 2.0
        const rssItems = parsed?.rss?.channel?.item;
        if (rssItems) {
            const items = Array.isArray(rssItems) ? rssItems : [rssItems];
            for (const item of items) {
                const entry = normalizeRssItem(item, channel);
                if (entry) entries.push(entry);
            }
        }

        // Atom
        const atomEntries = parsed?.feed?.entry;
        if (atomEntries) {
            const items = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
            for (const item of items) {
                const entry = normalizeAtomEntry(item, channel);
                if (entry) entries.push(entry);
            }
        }

        return entries.filter(e => e && e.title && e.url);
    } catch (e) {
        console.warn(`[RSS] Failed to fetch ${channel.name}: ${e.message}`);
        return [];
    }
};

// ── Normalize RSS 2.0 Item ─────────────────────────────────────
const normalizeRssItem = (item, channel) => {
    try {
        let title = (typeof item.title === 'string' ? item.title : item.title?._ || '').trim();
        const url = (item.link || item.guid?._ || item.guid || '').trim();

        // Extract raw HTML for full reading
        const rawContent = item['content:encoded'] || item.content || item.description || '';

        // Strip for description
        const rawDesc = item.description || item['content:encoded'] || '';
        const description = stripHtml(rawDesc).substring(0, 400);

        const pubDate = item.pubDate || item['dc:date'] || '';
        const author = item['dc:creator'] || item.author || '';
        let imageUrl = extractImageFromHtml(rawDesc);

        // Google News: extract real source from title
        let realSource = channel.name;
        if (channel.id.startsWith('google-') && title.includes(' - ')) {
            const parts = title.split(' - ');
            realSource = parts.pop().trim();
            title = parts.join(' - ').trim();
        }

        // For Google News, derive favicon from the article's actual domain
        const sourceFavicon = channel.id.startsWith('google-') && url
            ? getFavicon(url)
            : channel.icon;

        return {
            id: makeArticleId(channel.id, url),
            title,
            url,
            channelId: channel.id,
            source: realSource,
            sourceIcon: sourceFavicon,
            sourceColor: channel.color,
            description,
            fullContent: rawContent, // Now passing full HTML content to frontend
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            author: typeof author === 'string' ? author : '',
            imageUrl,
            category: channel.category,
        };
    } catch { return null; }
};

// ── Normalize Atom Entry ───────────────────────────────────────
const normalizeAtomEntry = (entry, channel) => {
    try {
        const title = (typeof entry.title === 'string' ? entry.title : entry.title?._ || '').trim();
        const link = entry.link;
        let url = '';
        if (typeof link === 'string') url = link;
        else if (Array.isArray(link)) url = link.find(l => l?.$?.rel === 'alternate')?.$?.href || link[0]?.$?.href || '';
        else if (link?.$?.href) url = link.$.href;

        const rawContent = entry.content?._ || entry.content || entry.summary?._ || entry.summary || '';
        const description = stripHtml(rawContent).substring(0, 400);
        const pubDate = entry.published || entry.updated || '';
        const author = entry.author?.name || '';
        let imageUrl = extractImageFromHtml(rawContent);

        return {
            id: makeArticleId(channel.id, url),
            title,
            url,
            channelId: channel.id,
            source: channel.name,
            sourceIcon: channel.icon,
            sourceColor: channel.color,
            description,
            fullContent: rawContent, // Now passing full HTML content to frontend
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            author: typeof author === 'string' ? author : '',
            imageUrl,
            category: channel.category,
        };
    } catch { return null; }
};

// ── Public APIs ────────────────────────────────────────────────

// Fetch a single channel's live feed
export const fetchChannelFeed = async (channelId) => {
    const channel = CHANNELS[channelId];
    if (!channel) return [];
    return parseFeed(channel);
};

// Fetch multiple channels' feeds in parallel, merge & sort by date
export const fetchMultipleChannels = async (channelIds) => {
    const validIds = channelIds.filter(id => CHANNELS[id]);
    if (validIds.length === 0) return [];

    console.log(`[RSS] Fetching ${validIds.length} channels: ${validIds.join(', ')}`);

    const results = await Promise.allSettled(
        validIds.map(id => fetchChannelFeed(id))
    );

    let allArticles = [];
    for (const result of results) {
        if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
        }
    }

    // Deduplicate by URL (simplified — just normalized URL)
    const seen = new Set();
    allArticles = allArticles.filter(a => {
        const key = a.url.replace(/\/$/, '').replace(/^https?:\/\/(www\.)?/, '').toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Sort newest first, but give a 12-hour artificial boost to Indian channels
    // so they appear higher up in the "Latest" and "Trending" feeds.
    allArticles.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();

        // Artificial boost for Indian content (e.g., add 12 hours)
        const boostA = a.category === 'indian' ? (12 * 60 * 60 * 1000) : 0;
        const boostB = b.category === 'indian' ? (12 * 60 * 60 * 1000) : 0;

        return (dateB + boostB) - (dateA + boostA);
    });

    console.log(`[RSS] Merged: ${allArticles.length} unique articles`);
    return allArticles;
};

// Get all channels as a list
export const getChannelList = () => Object.values(CHANNELS);
