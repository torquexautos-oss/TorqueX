import { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw, Clock, AlertCircle, Sparkles, ExternalLink,
    ChevronLeft, ChevronRight, Search, Rss, X, ArrowLeft
} from 'lucide-react';
import './NewsFeedPage.css';

const API_BASE = 'http://localhost:3002';

const NewsFeedPage = () => {
    // Channel discovery state
    const [channels, setChannels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subscribedChannels, setSubscribedChannels] = useState(() => {
        const saved = localStorage.getItem('torquex-channels');
        return saved ? JSON.parse(saved) : ['autocar-india', 'google-india', 'google-ev'];
    });
    const [channelCategory, setChannelCategory] = useState('all');

    // Feed state
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // View state: 'channels' or 'feed'
    const [view, setView] = useState('channels');

    // Reader state
    const [readerArticle, setReaderArticle] = useState(null);

    // AI summary state
    const [summaries, setSummaries] = useState({});
    const [summarizing, setSummarizing] = useState({});

    // Fetch channel list
    useEffect(() => {
        fetch(`${API_BASE}/api/channels`)
            .then(r => r.json())
            .then(data => {
                setChannels(data.channels || []);
                setCategories(data.categories || []);
            })
            .catch(err => console.error('Failed to load channels:', err));
    }, []);

    // Save subscriptions to localStorage
    useEffect(() => {
        localStorage.setItem('torquex-channels', JSON.stringify(subscribedChannels));
    }, [subscribedChannels]);

    // Fetch feed
    const fetchFeed = useCallback(async (pg = 1, query = '') => {
        if (subscribedChannels.length === 0) return;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({
                channels: subscribedChannels.join(','),
                page: pg,
                limit: 20,
            });
            if (query) params.set('q', query);

            const res = await fetch(`${API_BASE}/api/feed?${params}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();

            setArticles(data.articles || []);
            setTotal(data.total || 0);
            setPage(data.page || 1);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error('Feed error:', err);
            setError('Unable to connect to the backend. Make sure the server is running.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [subscribedChannels]);

    // Fetch feed when entering feed view or subscriptions change
    useEffect(() => {
        if (view === 'feed' && subscribedChannels.length > 0) {
            fetchFeed(1, searchQuery);
        }
    }, [view, subscribedChannels, fetchFeed]);

    // Toggle channel subscription
    const toggleChannel = (channelId) => {
        setSubscribedChannels(prev =>
            prev.includes(channelId)
                ? prev.filter(id => id !== channelId)
                : [...prev, channelId]
        );
    };

    // AI Summary
    const requestSummary = async (article) => {
        if (summaries[article.id] || summarizing[article.id]) return;
        setSummarizing(prev => ({ ...prev, [article.id]: true }));
        try {
            const res = await fetch(`${API_BASE}/api/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: article.title, description: article.description, url: article.url }),
            });
            const data = await res.json();
            if (data.summary) {
                setSummaries(prev => ({ ...prev, [article.id]: data.summary }));
            }
        } catch (err) {
            console.error('Summary error:', err);
        } finally {
            setSummarizing(prev => ({ ...prev, [article.id]: false }));
        }
    };

    // Time ago helper
    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    // Filter channels by category
    const filteredChannels = channelCategory === 'all'
        ? channels
        : channels.filter(ch => ch.category === channelCategory);

    // ── READER VIEW ──
    if (readerArticle) {
        return (
            <div className="reader-overlay">
                <div className="reader-topbar">
                    <button className="reader-back-btn" onClick={() => setReaderArticle(null)}>
                        <ArrowLeft size={16} /> Back to feed
                    </button>
                    <span className="reader-source">{readerArticle.source}</span>
                    <a href={readerArticle.url} target="_blank" rel="noopener noreferrer" className="article-action-btn">
                        <ExternalLink size={13} /> Open original
                    </a>
                </div>
                <iframe
                    src={readerArticle.url}
                    className="reader-iframe"
                    title={readerArticle.title}
                    sandbox="allow-same-origin allow-scripts"
                    onError={() => { }}
                />
            </div>
        );
    }

    // ── FEED VIEW ──
    if (view === 'feed') {
        return (
            <main className="news-page container-wide">
                <header className="feed-header animate-fade-in-up">
                    <div>
                        <div className="feed-live-badge">
                            <span className="live-dot" /> LIVE FEED
                        </div>
                        <h1>Your <span className="gradient-text">Newswire</span></h1>
                    </div>
                    <div className="feed-header-actions">
                        <form className="news-search-form" onSubmit={(e) => { e.preventDefault(); fetchFeed(1, searchQuery); }}>
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button type="button" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                                    onClick={() => { setSearchQuery(''); fetchFeed(1, ''); }}>
                                    <X size={13} />
                                </button>
                            )}
                        </form>
                        <button className="btn btn-outline btn-sm" onClick={() => { setRefreshing(true); fetchFeed(page, searchQuery); }}>
                            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setView('channels')}>
                            <Rss size={14} /> Channels
                        </button>
                    </div>
                </header>

                {/* Stats */}
                {!loading && articles.length > 0 && (
                    <div className="feed-stats">
                        <span className="news-stat">{total} articles</span>
                        <span className="news-stat-sep" />
                        <span className="news-stat">{subscribedChannels.length} channels</span>
                        <span className="news-stat-sep" />
                        <span className="news-stat">Page {page} of {totalPages}</span>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="news-loading">
                        <div className="loading-spinner" />
                        <p className="loading-text">Fetching live articles...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="news-error">
                        <AlertCircle size={24} />
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={() => fetchFeed(page, searchQuery)}>Retry</button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && articles.length === 0 && (
                    <div className="news-empty">
                        <Rss size={32} />
                        <h3>No articles found</h3>
                        <p>{subscribedChannels.length === 0 ? 'Subscribe to some channels first.' : 'Try a different search or refresh.'}</p>
                        {subscribedChannels.length === 0 && (
                            <button className="btn btn-primary" onClick={() => setView('channels')}>Browse Channels</button>
                        )}
                    </div>
                )}

                {/* Article list */}
                {!loading && articles.length > 0 && (
                    <div className="articles-list">
                        {articles.map((article) => (
                            <article key={article.id} className="article-card card">
                                <div className="article-row" onClick={() => setReaderArticle(article)}>
                                    {article.imageUrl && (
                                        <div className="article-thumb">
                                            <img src={article.imageUrl} alt="" loading="lazy" onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                                        </div>
                                    )}
                                    <div className="article-content">
                                        <div className="article-source-row">
                                            {article.sourceIcon && <img src={article.sourceIcon} alt="" className="source-favicon" />}
                                            <span className="source-badge" style={{ '--badge-color': article.sourceColor }}>{article.source}</span>
                                            <span className="article-time"><Clock size={11} /> {timeAgo(article.publishedAt)}</span>
                                        </div>
                                        <h2 className="article-title">{article.title}</h2>
                                        {article.description && <p className="article-desc">{article.description}</p>}
                                        {summaries[article.id] && (
                                            <div className="ai-summary">
                                                <Sparkles size={14} />
                                                <span>{summaries[article.id]}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="article-actions">
                                    <button
                                        className="article-action-btn"
                                        onClick={() => requestSummary(article)}
                                        disabled={!!summaries[article.id] || summarizing[article.id]}
                                    >
                                        <Sparkles size={12} />
                                        {summarizing[article.id] ? 'Summarizing...' : summaries[article.id] ? 'Summarized' : 'AI Summary'}
                                    </button>
                                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-action-btn">
                                        <ExternalLink size={12} /> Read original
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button className="pagination-btn" disabled={page <= 1} onClick={() => fetchFeed(page - 1, searchQuery)}>
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span className="pagination-info">Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
                        <button className="pagination-btn" disabled={page >= totalPages} onClick={() => fetchFeed(page + 1, searchQuery)}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </main>
        );
    }

    // ── CHANNEL DISCOVERY VIEW ──
    return (
        <main className="news-page container-wide">
            <header className="channels-header animate-fade-in-up">
                <div>
                    <h1>AI <span className="gradient-text">Newswire</span></h1>
                    <p>Subscribe to live news channels from top automotive publications, EV blogs, Reddit communities, and more. Zero AI cost — real RSS feeds refreshed every 15 minutes.</p>
                </div>
                {subscribedChannels.length > 0 && (
                    <button className="btn btn-primary go-to-feed-btn btn-lg" onClick={() => setView('feed')}>
                        <Rss size={16} /> Open Feed ({subscribedChannels.length})
                    </button>
                )}
            </header>

            {/* Category filter */}
            <div className="channel-category-bar">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-chip ${channelCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setChannelCategory(cat.id)}
                    >
                        <span>{cat.icon}</span> {cat.label}
                    </button>
                ))}
            </div>

            {/* Channel actions bar */}
            <div className="channel-actions">
                <span className="subscribed-count">{subscribedChannels.length} subscribed</span>
                {subscribedChannels.length > 0 && (
                    <button className="btn btn-outline btn-sm" onClick={() => setSubscribedChannels([])}>
                        Clear all
                    </button>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => setSubscribedChannels(channels.map(c => c.id))}>
                    Subscribe all
                </button>
            </div>

            {/* Channel grid */}
            <div className="channel-grid">
                {filteredChannels.map(ch => {
                    const isSubscribed = subscribedChannels.includes(ch.id);
                    return (
                        <div
                            key={ch.id}
                            className={`channel-card ${isSubscribed ? 'subscribed' : ''}`}
                            style={{ '--ch-color': ch.color }}
                        >
                            <div className="channel-card-header">
                                <img src={ch.icon} alt="" className="channel-favicon" />
                                <span className="channel-category-tag">{ch.category}</span>
                            </div>
                            <div className="channel-name">{ch.name}</div>
                            <div className="channel-desc">{ch.description}</div>
                            <div className="channel-card-footer">
                                <a href={ch.website} target="_blank" rel="noopener noreferrer" className="channel-website">
                                    <ExternalLink size={11} /> Visit site
                                </a>
                                <button
                                    className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                                    onClick={() => toggleChannel(ch.id)}
                                >
                                    {isSubscribed ? '✓ Subscribed' : '+ Subscribe'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            {subscribedChannels.length > 0 && (
                <div className="channel-cta">
                    <button className="btn btn-primary btn-lg" onClick={() => setView('feed')}>
                        <Rss size={18} /> Launch Feed — {subscribedChannels.length} channels
                    </button>
                </div>
            )}
        </main>
    );
};

export default NewsFeedPage;
