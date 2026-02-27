import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    RefreshCw, Clock, Search, Globe, Zap, ChevronLeft, ChevronRight,
    X, ExternalLink, BookOpen, Sparkles, Plus, Check, Radio, Rss, ArrowLeft, AlertCircle
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

const STORAGE_KEY = 'torquex_subscribed_channels';
const getSubscribed = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
};
const saveSubscribed = (ids) => localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));

const NewsFeedPage = () => {
    const [view, setView] = useState('feed');
    const [channels, setChannels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subscribed, setSubscribed] = useState(getSubscribed());
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalArticles, setTotalArticles] = useState(0);
    const [readerUrl, setReaderUrl] = useState('');
    const [readerSource, setReaderSource] = useState('');
    const [readerTitle, setReaderTitle] = useState('');
    const [iframeError, setIframeError] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(null);
    const [summaries, setSummaries] = useState({});
    const [lastRefresh, setLastRefresh] = useState(null);
    const [channelFilter, setChannelFilter] = useState('all');
    const refreshTimerRef = useRef(null);

    // Load channels from backend
    useEffect(() => {
        fetch('http://localhost:3002/api/channels')
            .then(r => r.json())
            .then(data => {
                setChannels(data.channels || []);
                setCategories(data.categories || []);
            })
            .catch(() => setError('Cannot connect to backend on port 3001'));
    }, []);

    // Switch to channels view if nothing subscribed
    useEffect(() => {
        if (channels.length > 0 && subscribed.length === 0) {
            setView('channels');
        }
    }, [channels, subscribed]);

    // Fetch live feed
    const fetchFeed = useCallback(async () => {
        if (subscribed.length === 0) return;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({
                channels: subscribed.join(','),
                page: page.toString(),
                limit: '20',
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
            setError('Cannot connect to backend');
        } finally {
            setLoading(false);
        }
    }, [subscribed, page, activeCategory, searchQuery]);

    useEffect(() => {
        if (subscribed.length > 0 && view === 'feed') fetchFeed();
    }, [fetchFeed, view]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (view === 'feed' && subscribed.length > 0) {
            refreshTimerRef.current = setInterval(fetchFeed, 5 * 60 * 1000);
            return () => clearInterval(refreshTimerRef.current);
        }
    }, [view, subscribed, fetchFeed]);

    const toggleSubscribe = (channelId) => {
        setSubscribed(prev => {
            const next = prev.includes(channelId)
                ? prev.filter(id => id !== channelId)
                : [...prev, channelId];
            saveSubscribed(next);
            return next;
        });
    };

    const subscribeAll = (categoryFilter) => {
        const ids = channels
            .filter(c => categoryFilter === 'all' || c.category === categoryFilter)
            .map(c => c.id);
        const merged = [...new Set([...subscribed, ...ids])];
        setSubscribed(merged);
        saveSubscribed(merged);
    };

    // On-demand AI summary
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

    const openReader = (article) => {
        setReaderUrl(article.url);
        setReaderSource(article.source);
        setReaderTitle(article.title);
        setIframeError(false);
        setView('reader');
    };

    const closeReader = () => { setReaderUrl(''); setView('feed'); };

    // ── Channel Discovery Grid ──────────────────────────────────
    const renderChannelGrid = () => {
        const filteredChannels = channelFilter === 'all'
            ? channels
            : channels.filter(c => c.category === channelFilter);

        return (
            <div className="channels-view">
                <header className="channels-header animate-fade-in-up">
                    <div>
                        <h1>News <span className="gradient-text">Channels</span></h1>
                        <p>Subscribe to your favorite automotive news sources. Your feed, your rules.</p>
                    </div>
                    {subscribed.length > 0 && (
                        <button className="btn btn-primary go-to-feed-btn" onClick={() => setView('feed')}>
                            <Rss size={16} /> My Feed ({subscribed.length})
                        </button>
                    )}
                </header>

                <div className="channel-category-bar animate-fade-in-up delay-1">
                    {categories.map(cat => (
                        <button key={cat.id} className={`category-chip ${channelFilter === cat.id ? 'active' : ''}`} onClick={() => setChannelFilter(cat.id)}>
                            <span>{cat.icon}</span> <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                <div className="channel-actions animate-fade-in-up delay-1">
                    <button className="btn btn-outline btn-sm" onClick={() => subscribeAll(channelFilter)}>
                        <Plus size={14} /> Subscribe to {channelFilter === 'all' ? 'all' : channelFilter}
                    </button>
                    {subscribed.length > 0 && (
                        <span className="subscribed-count">{subscribed.length} channel{subscribed.length !== 1 ? 's' : ''} subscribed</span>
                    )}
                </div>

                <div className="channel-grid">
                    {filteredChannels.map((ch, idx) => {
                        const isSub = subscribed.includes(ch.id);
                        return (
                            <div key={ch.id} className={`channel-card animate-fade-in-up delay-${Math.min(idx % 6 + 1, 5)} ${isSub ? 'subscribed' : ''}`} style={{ '--ch-color': ch.color }}>
                                <div className="channel-card-header">
                                    <img src={ch.icon} alt={ch.name} className="channel-favicon" />
                                    <span className="channel-category-tag">{ch.category}</span>
                                </div>
                                <h3 className="channel-name">{ch.name}</h3>
                                <p className="channel-desc">{ch.description}</p>
                                <div className="channel-card-footer">
                                    <a href={ch.website} target="_blank" rel="noopener noreferrer" className="channel-website">
                                        <Globe size={12} /> Visit site
                                    </a>
                                    <button className={`subscribe-btn ${isSub ? 'subscribed' : ''}`} onClick={() => toggleSubscribe(ch.id)}>
                                        {isSub ? <><Check size={14} /> Subscribed</> : <><Plus size={14} /> Subscribe</>}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {subscribed.length > 0 && (
                    <div className="channel-cta animate-fade-in-up">
                        <button className="btn btn-primary btn-lg" onClick={() => setView('feed')}>
                            <Rss size={18} /> Open My Feed — {subscribed.length} channels
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // ── Live Feed ───────────────────────────────────────────────
    const renderFeed = () => (
        <div className="feed-view">
            <header className="feed-header animate-fade-in-up">
                <div className="feed-header-left">
                    <div className="feed-live-badge"><span className="live-dot" /><span>Live Feed</span></div>
                    <h1>My <span className="gradient-text">Newswire</span></h1>
                </div>
                <div className="feed-header-actions">
                    <form className="news-search-form" onSubmit={(e) => { e.preventDefault(); setPage(1); fetchFeed(); }}>
                        <Search size={16} />
                        <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </form>
                    <button className="btn btn-outline btn-sm" onClick={() => setView('channels')}>
                        <Rss size={14} /> Channels ({subscribed.length})
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setPage(1); fetchFeed(); }} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </header>

            {!loading && articles.length > 0 && (
                <div className="feed-stats animate-fade-in-up delay-1">
                    <span className="news-stat"><Radio size={13} /> {totalArticles} articles</span>
                    <span className="news-stat-sep" />
                    <span className="news-stat"><Globe size={13} /> {[...new Set(articles.map(a => a.source))].length} sources</span>
                    <span className="news-stat-sep" />
                    <span className="news-stat"><Zap size={13} /> Live from {subscribed.length} channels</span>
                    {lastRefresh && (<><span className="news-stat-sep" /><span className="news-stat"><Clock size={13} /> {timeAgo(lastRefresh.toISOString())}</span></>)}
                </div>
            )}

            <div className="category-bar animate-fade-in-up delay-1">
                <button className={`category-chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => { setActiveCategory('all'); setPage(1); }}>
                    📰 All
                </button>
                {[...new Set(subscribed.map(id => channels.find(c => c.id === id)?.category).filter(Boolean))].map(cat => (
                    <button key={cat} className={`category-chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => { setActiveCategory(cat); setPage(1); }}>
                        {categories.find(c => c.id === cat)?.icon} {categories.find(c => c.id === cat)?.label || cat}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="news-loading">
                    <div className="loading-spinner" /><p className="loading-text">Fetching live news...</p>
                </div>
            )}

            {error && !loading && (
                <div className="news-error"><AlertCircle size={24} /><p>{error}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchFeed}>Retry</button>
                </div>
            )}

            {!loading && articles.length > 0 && (
                <>
                    <div className="articles-list">
                        {articles.map((article, idx) => (
                            <article key={article.id || idx} className={`article-card card animate-fade-in-up delay-${Math.min(idx % 5 + 1, 5)}`}>
                                <div className="article-row" onClick={() => openReader(article)}>
                                    {article.imageUrl && (
                                        <div className="article-thumb"><img src={article.imageUrl} alt="" loading="lazy" /></div>
                                    )}
                                    <div className="article-content">
                                        <div className="article-source-row">
                                            <span className="source-badge" style={{ '--badge-color': article.sourceColor }}>
                                                <img src={article.sourceIcon} alt="" className="source-favicon" />
                                                {article.source}
                                            </span>
                                            <span className="article-time"><Clock size={11} /> {timeAgo(article.publishedAt)}</span>
                                        </div>
                                        <h3 className="article-title">{article.title}</h3>
                                        <p className="article-desc">{article.description}</p>
                                        {summaries[article.id] && (
                                            <div className="ai-summary"><Sparkles size={12} /><span>{summaries[article.id]}</span></div>
                                        )}
                                    </div>
                                </div>
                                <div className="article-actions">
                                    <button className="article-action-btn" onClick={(e) => { e.stopPropagation(); requestSummary(article); }} disabled={summaryLoading === article.id || !!summaries[article.id]}>
                                        <Sparkles size={13} /> {summaryLoading === article.id ? 'Summarizing...' : summaries[article.id] ? 'Summarized' : 'AI Summary'}
                                    </button>
                                    <button className="article-action-btn" onClick={() => openReader(article)}><BookOpen size={13} /> Read</button>
                                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-action-btn" onClick={(e) => e.stopPropagation()}>
                                        <ExternalLink size={13} /> Open Original
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft size={18} /> Previous</button>
                            <span className="pagination-info">Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
                            <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next <ChevronRight size={18} /></button>
                        </div>
                    )}
                </>
            )}

            {!loading && !error && articles.length === 0 && subscribed.length > 0 && (
                <div className="news-empty"><Radio size={32} /><h3>No articles found</h3>
                    <p>{searchQuery ? `No results for "${searchQuery}"` : 'Your channels haven\'t published anything matching this filter yet.'}</p>
                </div>
            )}
        </div>
    );

    // ── Embedded Reader ─────────────────────────────────────────
    const renderReader = () => (
        <div className="reader-overlay">
            <div className="reader-topbar">
                <button className="reader-back-btn" onClick={closeReader}><ArrowLeft size={18} /> Back to Feed</button>
                <span className="reader-source">{readerSource}</span>
                <div className="reader-topbar-actions">
                    <a href={readerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><ExternalLink size={14} /> Open in new tab</a>
                </div>
            </div>
            {iframeError ? (
                <div className="reader-fallback">
                    <Globe size={48} /><h3>This site doesn't allow embedding</h3><p>{readerTitle}</p>
                    <a href={readerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><ExternalLink size={16} /> Read on {readerSource}</a>
                </div>
            ) : (
                <iframe
                    src={readerUrl} className="reader-iframe" title={readerTitle}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    onError={() => setIframeError(true)}
                    onLoad={(e) => { try { const doc = e.target.contentDocument; if (!doc || !doc.body || doc.body.innerHTML.length < 50) setIframeError(true); } catch { } }}
                />
            )}
        </div>
    );

    return (
        <main className="news-page container-wide">
            {view === 'channels' && renderChannelGrid()}
            {view === 'feed' && renderFeed()}
            {view === 'reader' && renderReader()}
        </main>
    );
};

export default NewsFeedPage;
