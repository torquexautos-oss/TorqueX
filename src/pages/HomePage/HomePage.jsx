import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VibeCheck from '../../components/VibeCheck/VibeCheck';
import { Search, Zap, Newspaper, LayoutGrid, BookOpen, ChevronRight, TrendingUp } from 'lucide-react';
import './HomePage.css';

// We'll parse the RSS feed here to surface "Latest Auto News" right on the Hero
const CARANDBIKE_RSS = "https://www.carandbike.com/rss/news";
const RSS_TO_JSON_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(CARANDBIKE_RSS)}`;

export default function HomePage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [news, setNews] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);

    useEffect(() => {
        // Fetch latest 3 news items for the editorial feel
        fetch(RSS_TO_JSON_API)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok') {
                    setNews(data.items.slice(0, 3));
                }
                setLoadingNews(false);
            })
            .catch(() => setLoadingNews(false));
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/cars?q=${encodeURIComponent(search.trim())}`);
        }
    };

    return (
        <main className="home-page editorial-layout">
            {/* ── MASSIVE MEDIAHOUSE HERO ── */}
            <section className="hero-section media-hero">
                <div className="hero-bg-gradient" />
                <div className="container hero-content">
                    <div className="animate-fade-in-up">
                        <span className="badge badge-glow editorial-badge">
                            <Zap size={14} /> The Ultimate Indian Auto Authority
                        </span>
                        <h1 className="editorial-headline">
                            Drive into the <span className="hero-highlight">Future.</span>
                        </h1>
                        <p className="hero-description">
                            Expert reviews, real-world data, and the most comprehensive car catalog in India—all powered by TorqueX intelligence.
                        </p>
                    </div>

                    {/* Global Master Search Bar -> Routes to Catalog */}
                    <form className="home-search editorial-search animate-fade-in-up delay-1" onSubmit={handleSearchSubmit}>
                        <Search size={22} className="search-icon" />
                        <input
                            type="text"
                            placeholder="What car are you looking for?"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="search-submit">Explore</button>
                    </form>
                </div>
            </section>

            <div className="container">
                {/* ── QUICK LINKS / TOOLS ── */}
                <section className="editorial-tools animate-fade-in-up delay-2">
                    <div className="tool-cards-grid">
                        <Link to="/cars" className="tool-card catalog-tool">
                            <div className="tool-icon-wrapper">
                                <LayoutGrid size={28} />
                            </div>
                            <h3>The Master Catalog</h3>
                            <p>Browse every single BS6-compliant car, filter by true monthly cost, and find exact specs.</p>
                            <span className="tool-link">Browse Catalog <ChevronRight size={16} /></span>
                        </Link>

                        <Link to="/search" className="tool-card wiki-tool">
                            <div className="tool-icon-wrapper">
                                <BookOpen size={28} />
                            </div>
                            <h3>Auto Encyclopedia</h3>
                            <p>Don't know what a dual-clutch is? Search our live Wikipedia-powered dictionary.</p>
                            <span className="tool-link">Learn Basics <ChevronRight size={16} /></span>
                        </Link>

                        <Link to="/news" className="tool-card news-tool">
                            <div className="tool-icon-wrapper">
                                <Newspaper size={28} />
                            </div>
                            <h3>Top Auto News</h3>
                            <p>Stay updated with the latest launches, spy shots, and industry shifts.</p>
                            <span className="tool-link">Read News <ChevronRight size={16} /></span>
                        </Link>
                    </div>
                </section>

                {/* ── VIBE CHECK AI ── */}
                <section className="home-vibe-section animate-fade-in-up delay-3">
                    <div className="section-header-editorial">
                        <h2>Personalized Matchmaker</h2>
                        <p>Let our AI find the perfect car for your exact lifestyle.</p>
                    </div>
                    <VibeCheck />
                </section>

                {/* ── TOP STORIES (RSS Integration on Homepage) ── */}
                <section className="home-news-section animate-fade-in-up delay-4">
                    <div className="section-header-editorial title-with-icon">
                        <TrendingUp size={28} className="text-primary" />
                        <h2>Trending Editorial</h2>
                    </div>

                    {loadingNews ? (
                        <div className="editorial-loading">Fetching latest stories...</div>
                    ) : (
                        <div className="editorial-news-grid">
                            {news.map((item, idx) => (
                                <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="editorial-news-card">
                                    <div className="news-image-wrapper">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt={item.title} />
                                        ) : (
                                            <div className="placeholder-image"><Newspaper size={32} /></div>
                                        )}
                                    </div>
                                    <div className="news-content">
                                        <span className="news-date">{new Date(item.pubDate).toLocaleDateString()}</span>
                                        <h3>{item.title}</h3>
                                        <div className="read-more">Read Full Story <ChevronRight size={14} /></div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <Link to="/news" className="btn btn-primary" style={{ display: 'inline-flex', padding: '0.75rem 2rem', borderRadius: '100px' }}>
                            View All Auto News  <ChevronRight size={18} style={{ marginLeft: '0.5rem' }} />
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}