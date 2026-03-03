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
    'motorbeam': {
        id: 'motorbeam',
        name: 'MotorBeam',
        description: 'Indian automotive news, reviews, and detailed shootout comparisons',
        icon: getFavicon('www.motorbeam.com'),
        color: '#0078ff',
        category: 'indian',
        feedUrl: 'https://www.motorbeam.com/feed/',
        website: 'https://www.motorbeam.com',
    },
    'rushlane': {
        id: 'rushlane',
        name: 'RushLane',
        description: 'Daily spy shots, launches, and breaking news from the Indian auto industry',
        icon: getFavicon('www.rushlane.com'),
        color: '#e31e24',
        category: 'indian',
        feedUrl: 'https://www.rushlane.com/feed',
        website: 'https://www.rushlane.com',
    },
    'gaadiwaadi': {
        id: 'gaadiwaadi',
        name: 'GaadiWaadi',
        description: 'Latest Indian car and bike news, scoops, and in-depth reviews',
        icon: getFavicon('gaadiwaadi.com'),
        color: '#ffcc00',
        category: 'indian',
        feedUrl: 'https://gaadiwaadi.com/feed/',
        website: 'https://gaadiwaadi.com',
    },
    'iab': {
        id: 'iab',
        name: 'Indian Autos Blog',
        description: 'The pioneer of Indian automotive blogging — scoops and global reveals',
        icon: getFavicon('indianautosblog.com'),
        color: '#d4af37',
        category: 'indian',
        feedUrl: 'https://indianautosblog.com/feed',
        website: 'https://indianautosblog.com',
    },
    'motor1': {
        id: 'motor1',
        name: 'Motor1',
        description: 'Global authority on car news, reviews, and future vehicle renders',
        icon: getFavicon('www.motor1.com'),
        color: '#000000',
        category: 'launches',
        feedUrl: 'https://www.motor1.com/rss/news/all/',
        website: 'https://www.motor1.com',
    },
    'jalopnik': {
        id: 'jalopnik',
        name: 'Jalopnik',
        description: 'The car culture and racing community — news with a unique perspective',
        icon: getFavicon('jalopnik.com'),
        color: '#f71a1a',
        category: 'tech',
        feedUrl: 'https://jalopnik.com/rss',
        website: 'https://jalopnik.com',
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

        // Feed normalization
        let realSource = channel.name;
        const sourceFavicon = channel.icon;

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
