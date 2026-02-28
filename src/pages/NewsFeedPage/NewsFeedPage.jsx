import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    RefreshCw, Clock, Search, Globe, Zap, ChevronLeft, ChevronRight,
    X, ExternalLink, BookOpen, Sparkles, AlertCircle, ArrowLeft, TrendingUp, Compass, Star
} from 'lucide-react';
import './NewsFeedPage.css';

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

    // Reader Mode
    const [view, setView] = useState('feed'); // 'feed' | 'reader'
    const [readerUrl, setReaderUrl] = useState('');
    const [readerSource, setReaderSource] = useState('');
    const [readerTitle, setReaderTitle] = useState('');
    const [readerContent, setReaderContent] = useState('');

    // Initial Data Load (Channels)
    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('http://localhost:3002/api/channels');
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
            const res = await fetch(`http://localhost:3002/api/feed?${params}`);
            const data = await res.json();

            if (res.ok) {
                setArticles(data.articles || []);
                setTotalPages(data.totalPages || 1);
                setTotalArticles(data.total || 0);
                setLastRefresh(new Date());
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
        if (view === 'feed' && allChannelIds.length > 0 && page === 1 && !searchQuery) {
            refreshTimerRef.current = setInterval(() => fetchFeed(true), 5 * 60 * 1000);
            return () => clearInterval(refreshTimerRef.current);
        }
    }, [view, allChannelIds, fetchFeed, page, searchQuery]);

    // AI On-Demand Summarization
    const requestSummary = async (article) => {
        if (summaries[article.id]) return;
        setSummaryLoading(article.id);
        try {
            const res = await fetch('http://localhost:3002/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: article.title, description: article.description, url: article.url }),
            });
            const data = await res.json();
            setSummaries(prev => ({ ...prev, [article.id]: data.summary || `⚠️ ${data.error || 'Failed'}` }));
        } catch {
            setSummaries(prev => ({ ...prev, [article.id]: '⚠️ Could not generate summary' }));
        } finally {
            setSummaryLoading(null);
        }
    };

    const [readerLoading, setReaderLoading] = useState(false);

    // Reader Mode Handlers
    const openReader = async (article) => {
        setReaderUrl(article.url);
        setReaderSource(article.source);
        setReaderTitle(article.title);
        setReaderContent('');
        setReaderLoading(true);
        setView('reader');
        window.scrollTo(0, 0); // Reset scroll position when opening reader

        try {
            // Fetch the full extracted HTML from our new backend parser endpoint
            const res = await fetch(`http://localhost:3002/api/article-content?url=${encodeURIComponent(article.url)}`);
            const data = await res.json();

            if (res.ok && data.content && data.content.length > 50) {
                setReaderContent(data.content);
            } else {
                throw new Error("Parser returned insufficient content");
            }
        } catch (err) {
            console.error("Failed to load full article natively:", err);
            // Fallback to description if fullContent extraction fails
            const fallbackHtml = (article.fullContent && article.fullContent.length > 100)
                ? article.fullContent
                : `<p class="reader-fallback-desc">${article.description}</p>
                   <p class="reader-fallback-error" style="color: #ef4444; margin-top: 1rem;">
                     <small><em>Note: TorqueX could not extract the full text for this specific article format. Please read the original.</em></small>
                   </p>`;
            setReaderContent(fallbackHtml);
        } finally {
            setReaderLoading(false);
        }
    };

    const closeReader = () => {
        setReaderUrl('');
        setReaderContent('');
        setReaderTitle('');
        setReaderSource('');
        setReaderLoading(false);
        setView('feed');
    };

    // Sub-components for rendering cards
    const renderArticleCard = (article, idx, type = 'standard') => {
        const isSummarized = !!summaries[article.id];
        const isSummarizing = summaryLoading === article.id;

        return (
            <article key={article.id || idx} className={`editorial-card ${type}-card`} onClick={() => openReader(article)}>
                {/* Image Section */}
                {article.imageUrl ? (
                    <div className="ec-image-wrapper">
                        <img src={article.imageUrl} alt="" loading="lazy" className="ec-image" />
                        <div className="ec-source-badge" style={{ '--badge-color': article.sourceColor }}>
                            <img src={article.sourceIcon} alt="" className="source-favicon" />
                            <span>{article.source}</span>
                        </div>
                    </div>
                ) : (
                    <div className="ec-image-wrapper fall-back-bg">
                        <div className="ec-source-badge" style={{ '--badge-color': article.sourceColor }}>
                            <img src={article.sourceIcon} alt="" className="source-favicon" />
                            <span>{article.source}</span>
                        </div>
                        <Globe size={32} opacity={0.2} />
                    </div>
                )}

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

    // ── Readers View ─────────────────────────────────────────
    if (view === 'reader') {
        return (
            <div className="reader-overlay slide-up">
                <div className="reader-topbar">
                    <button className="reader-back-btn" onClick={closeReader}>
                        <ArrowLeft size={18} /> Exit Reader
                    </button>
                    <div className="reader-center-info">
                        <span className="reader-source-pill">{readerSource}</span>
                        <h2 className="reader-title-preview">{readerTitle}</h2>
                    </div>
                    <div className="reader-topbar-actions">
                        <a href={readerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                            <ExternalLink size={14} /> Open Original
                        </a>
                    </div>
                </div>

                <div className="reader-content-container">
                    <div className="reader-article-body">
                        <h1>{readerTitle}</h1>

                        {readerLoading ? (
                            <div className="reader-loading-state">
                                <RefreshCw size={32} className="spin text-primary" />
                                <p>Extracting full article text...</p>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="reader-html-content fade-in"
                                    dangerouslySetInnerHTML={{ __html: readerContent }}
                                />

                                <div className="reader-footer-cta fade-in">
                                    <p>To read the full ongoing discussion or view interactive elements, visit the original publisher.</p>
                                    <a href={readerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg mt-4">
                                        <ExternalLink size={16} /> Continue Reading on {readerSource}
                                    </a>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

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
                        {cat.icon} {cat.label}
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
