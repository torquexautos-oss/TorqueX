import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    RefreshCw, Clock, Search, Globe, Zap, ChevronLeft, ChevronRight,
    X, ExternalLink, BookOpen, Sparkles, AlertCircle, TrendingUp, Compass, Star
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { API_BASE_URL } from '../../config';
import './NewsFeedPage.css';

// Batch-write article metadata to Firestore so every article gets
// a stable, shareable URL immediately — not just after a click.
const persistArticlesToFirestore = async (articles) => {
    if (!articles || articles.length === 0) return;
    try {
        // Firestore batch writes are capped at 500 ops per batch
        const BATCH_SIZE = 400;
        for (let i = 0; i < articles.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const chunk = articles.slice(i, i + BATCH_SIZE);
            for (const article of chunk) {
                if (!article.id) continue;
                const ref = doc(db, 'feed_articles', article.id);
                batch.set(ref, {
                    id: article.id,
                    title: article.title || '',
                    url: article.url || '',
                    source: article.source || '',
                    sourceIcon: article.sourceIcon || null,
                    publishedAt: article.publishedAt || null,
                    description: article.description || '',
                    imageUrl: article.imageUrl || null,
                    category: article.category || '',
                    channelId: article.channelId || '',
                    // Only set updatedAt; don't overwrite createdAt if doc already exists
                    updatedAt: new Date().toISOString(),
                }, { merge: true });
            }
            await batch.commit();
        }
    } catch (err) {
        // Non-critical — if Firestore is unavailable or rules block it, we log quietly
        console.warn('[Firestore] Could not persist articles:', err.code || err.message);
    }
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const NewsFeedPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [allChannelIds, setAllChannelIds] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtering & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalArticles, setTotalArticles] = useState(0);
    const [lastRefresh, setLastRefresh] = useState(null);
    const refreshTimerRef = useRef(null);

    // AI Summary
    const [summaryLoading, setSummaryLoading] = useState(null);
    const [summaries, setSummaries] = useState({});

    // Initial Data Load (Channels)
    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/channels`);
                if (!res.ok) throw new Error('Failed to load channels');
                const data = await res.json();
                const ids = (data.channels || []).map(c => c.id);
                setCategories(data.categories || []);
                setAllChannelIds(ids);
            } catch (err) {
                setError('Could not connect to news server.');
                setLoading(false);
            }
        };
        init();
    }, []);

    // Fetch Master Feed
    const fetchFeed = useCallback(async (isRefresh = false) => {
        if (allChannelIds.length === 0) return;
        if (!isRefresh) setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams({
                channels: allChannelIds.join(','),
                page: page.toString(),
                limit: '24', // Enough to fill out the magazine grid
                ...(activeCategory !== 'all' && { category: activeCategory }),
                ...(searchQuery && { q: searchQuery }),
            });
            const res = await fetch(`${API_BASE_URL}/api/feed?${params}`);
            const data = await res.json();

            if (res.ok) {
                const fetchedArticles = data.articles || [];
                setArticles(fetchedArticles);
                setTotalPages(data.totalPages || 1);
                setTotalArticles(data.total || 0);
                setLastRefresh(new Date());
                // Pre-write all articles to Firestore in the background
                // so every article link is shareable immediately for all users
                persistArticlesToFirestore(fetchedArticles);
            } else {
                setError(data.error || 'Failed to fetch feed');
            }
        } catch {
            setError('Lost connection to the TorqueX feed.');
        } finally {
            setLoading(false);
        }
    }, [allChannelIds, page, activeCategory, searchQuery]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    // Auto-refresh every 5 minutes on page 1 only
    useEffect(() => {
        if (allChannelIds.length > 0 && page === 1 && !searchQuery) {
            refreshTimerRef.current = setInterval(() => fetchFeed(true), 5 * 60 * 1000);
            return () => clearInterval(refreshTimerRef.current);
        }
    }, [allChannelIds, fetchFeed, page, searchQuery]);

    // AI On-Demand Summarization
    const requestSummary = async (article) => {
        if (summaries[article.id]) return;
        setSummaryLoading(article.id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: article.title, description: article.description, url: article.url }),
            });
            const data = await res.json();
            setSummaries(prev => ({ ...prev, [article.id]: data.summary || `Error: ${data.error || 'Failed'}` }));
        } catch {
            setSummaries(prev => ({ ...prev, [article.id]: 'Error: Could not generate summary' }));
        } finally {
            setSummaryLoading(null);
        }
    };

    // Navigate to dedicated Article Page
    // Article metadata is already in Firestore from the batch write above
    const openReader = (article) => {
<<<<<<< Updated upstream
        navigate(`/news/article/${article.id}`);
=======
        try {
            const docRef = doc(db, 'feed_articles', article.id);
            // Fire and forget the Firestore write to ensure UI keeps history
            setDoc(docRef, {
                id: article.id,
                title: article.title,
                url: article.url,
                source: article.source,
                sourceIcon: article.sourceIcon || null,
                publishedAt: article.publishedAt,
                description: article.description,
                imageUrl: article.imageUrl || article.urlToImage || article.image || null,
                createdAt: serverTimestamp()
            }, { merge: true }).catch(err => {
                console.error("Failed to save article route to Firestore:", err);
            });

            navigate(`/news/article/${article.id}`);
        } catch (err) {
            console.error("Critical routing error:", err);
            navigate(`/news/article/${article.id}`);
        }
>>>>>>> Stashed changes
    };

    // Sub-components for rendering cards
    // Category-to-icon mapping for rich fallbacks
    const CATEGORY_ICONS = {
        indian: Globe,
        evs: Zap,
        motorsport: TrendingUp,
        industry: Globe,
        policy: BookOpen,
        tech: Zap,
        reviews: BookOpen,
        launches: Sparkles,
        community: Clock,
    };

    // Deterministic gradient from source name
    const getGradient = (source) => {
        let hash = 0;
        for (let i = 0; i < (source || '').length; i++) hash = source.charCodeAt(i) + ((hash << 5) - hash);
        const hue = Math.abs(hash) % 360;
        return `linear-gradient(135deg, hsl(${hue}, 40%, 12%) 0%, hsl(${(hue + 40) % 360}, 35%, 8%) 100%)`;
    };

    // Preload images on hover for faster ArticleReader open
    const handleArticleHover = (imageUrl) => {
        if (!imageUrl) return;
        const img = new Image();
        img.src = imageUrl;
    };

    const renderArticleCard = (article, idx, type = 'standard') => {
        const isSummarized = !!summaries[article.id];
        const isSummarizing = summaryLoading === article.id;
        const FallbackIcon = CATEGORY_ICONS[article.category] || Globe;

        return (
            <article
                key={article.id || idx}
                className={`editorial-card ${type}-card`}
                onClick={() => openReader(article)}
                onMouseEnter={() => handleArticleHover(article.imageUrl || article.urlToImage || article.image)}
            >
                {/* Image Section */}
                <div
                    className="ec-image-wrapper"
                    style={{ background: getGradient(article.source) }}
                >
                    {article.imageUrl && (
                        <img
                            src={article.imageUrl}
                            alt=""
                            loading="lazy"
                            className="ec-image"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                    {/* Fallback layer — always present behind image */}
                    <div className="ec-fallback-content">
                        <FallbackIcon size={type === 'hero' ? 44 : 28} strokeWidth={1.2} />
                        <span className="ec-fallback-source">{article.source}</span>
                    </div>
                    <div className="ec-source-badge" style={{ '--badge-color': article.sourceColor }}>
                        <span>{article.source}</span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="ec-content">
                    <div className="ec-meta">
                        <span className="ec-time"><Clock size={12} /> {timeAgo(article.publishedAt)}</span>
                        {article.category && <span className="ec-cat">{article.category}</span>}
                    </div>

                    <h3 className="ec-title">{article.title}</h3>

                    {/* Only show desc for larger cards or if requested */}
                    {type !== 'trending' && (
                        <p className="ec-desc">{article.description}</p>
                    )}

                    {/* AI Summary Block */}
                    {isSummarized && (
                        <div className="ec-ai-summary" onClick={e => e.stopPropagation()}>
                            <Sparkles size={14} className="magic-icon" />
                            <p>{summaries[article.id]}</p>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="ec-actions">
                    <button
                        className={`ec-ai-btn ${isSummarized ? 'done' : ''}`}
                        onClick={(e) => { e.stopPropagation(); requestSummary(article); }}
                        disabled={isSummarizing || isSummarized}
                    >
                        {isSummarizing ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                        <span>{isSummarizing ? 'Analyzing...' : isSummarized ? 'Summarized' : 'TorqueX Take'}</span>
                    </button>
                    <div className="ec-action-group">
                        <button className="ec-icon-btn" onClick={(e) => { e.stopPropagation(); openReader(article); }} title="Read Mode">
                            <BookOpen size={16} />
                        </button>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="ec-icon-btn" onClick={e => e.stopPropagation()} title="Open Original">
                            <ExternalLink size={16} />
                        </a>
                    </div>
                </div>
            </article>
        );
    };



    // Split articles into Magazine Layout (Hero, Trending, List)
    const isFirstPageComplete = page === 1 && !searchQuery && activeCategory === 'all' && articles.length >= 5;
    const heroArticle = isFirstPageComplete ? articles[0] : null;
    const trendingArticles = isFirstPageComplete ? articles.slice(1, 5) : [];
    const listArticles = isFirstPageComplete ? articles.slice(5) : articles;

    return (
        <main className="editorial-page container-wide">

            {/* Master Header */}
            <header className="editorial-header">
                <div className="ed-header-left">
                    <div className="ed-badge">
                        <span className="live-dot" /> LIVE EDITORIAL
                    </div>
                    <h1>TorqueX <span className="gradient-text">Media</span></h1>
                    <p className="ed-subtitle">Curated live feeds from premium automotive publishers, supercharged with AI.</p>
                </div>

                <div className="ed-header-right">
                    <form className="ed-search-box" onSubmit={(e) => { e.preventDefault(); setPage(1); fetchFeed(); }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search automotive news..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button type="button" className="clear-search" onClick={() => { setSearchQuery(''); setPage(1); fetchFeed(); }}>
                                <X size={14} />
                            </button>
                        )}
                    </form>
                    <button className="btn btn-outline btn-icon" onClick={() => { setPage(1); fetchFeed(true); }} disabled={loading} title="Refresh Feed">
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Category Navigation */}
            <nav className="ed-category-nav">
                <button className={`ed-cat-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => { setActiveCategory('all'); setPage(1); }}>
                    <Compass size={16} /> All Coverage
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`ed-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => { setActiveCategory(cat.id); setPage(1); }}
                    >
                        {cat.label}
                    </button>
                ))}
            </nav>

            {/* Error State */}
            {error && !loading && (
                <div className="ed-empty-state error-state slide-up">
                    <AlertCircle size={48} className="text-red" />
                    <h2>Connection Error</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary mt-4" onClick={() => fetchFeed()}>Try Again</button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && articles.length === 0 && (
                <div className="ed-empty-state slide-up">
                    <Search size={48} className="text-muted" />
                    <h2>No coverage found</h2>
                    <p>{searchQuery ? `We couldn't find any articles matching "${searchQuery}".` : 'No articles available in this category currently.'}</p>
                    {searchQuery && <button className="btn btn-primary mt-4" onClick={() => { setSearchQuery(''); fetchFeed(); }}>Clear Search</button>}
                </div>
            )}

            {/* Loading Skeleton Indicator (Only on initial load/page change, not background refresh) */}
            {loading && articles.length === 0 && (
                <div className="ed-loading-view">
                    <div className="magical-spinner" />
                    <p>Fetching the latest auto news...</p>
                </div>
            )}

            {/* Magazine Layout */}
            {!loading && articles.length > 0 && (
                <div className="ed-content fade-in">

                    {/* Top Section: Hero + Trending Grid */}
                    {isFirstPageComplete && (
                        <div className="ed-top-section section-fade-in delay-1">
                            {/* Hero Article */}
                            <div className="ed-hero-column">
                                <div className="section-title"><Star size={18} /> Top Story</div>
                                {renderArticleCard(heroArticle, 0, 'hero')}
                            </div>

                            {/* Trending Right Grid */}
                            <div className="ed-trending-column">
                                <div className="section-title"><TrendingUp size={18} /> Trending Now</div>
                                <div className="ed-trending-grid">
                                    {trendingArticles.map((article, idx) => renderArticleCard(article, idx + 1, 'trending'))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lower Section: Latest Feed List */}
                    <div className="ed-latest-section section-fade-in delay-2">
                        <div className="section-title-row">
                            <div className="section-title"><Clock size={18} /> {isFirstPageComplete ? 'More Latest News' : 'Search Results'}</div>
                            <div className="ed-feed-stats">
                                <span>{totalArticles} articles available</span>
                                {lastRefresh && <span>Updated {timeAgo(lastRefresh.toISOString())}</span>}
                            </div>
                        </div>

                        <div className="ed-list-grid">
                            {listArticles.map((article, idx) => renderArticleCard(article, isFirstPageComplete ? idx + 5 : idx, 'list'))}
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="ed-pagination section-fade-in delay-3">
                            <button className="ed-page-btn" onClick={() => { setPage(1); window.scrollTo(0, 0); }} disabled={page <= 1}>
                                First
                            </button>
                            <button className="ed-page-btn" onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }} disabled={page <= 1}>
                                <ChevronLeft size={18} /> Prev
                            </button>
                            <span className="ed-page-info">
                                Page <span className="highlight-page">{page}</span> of {totalPages}
                            </span>
                            <button className="ed-page-btn" onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }} disabled={page >= totalPages}>
                                Next <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
};

export default NewsFeedPage;
