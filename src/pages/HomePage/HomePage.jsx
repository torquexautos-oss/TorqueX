import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CatalogHighlights from '../../components/CatalogHighlights/CatalogHighlights';
import VibeCheck from '../../components/VibeCheck/VibeCheck';
import LegendaryLapTicker from '../../components/LegendaryLapTicker/LegendaryLapTicker';
import { Search, Zap, Newspaper, LayoutGrid, BookOpen, ChevronRight, TrendingUp, Car } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import './HomePage.css';

// We'll parse the RSS feed here to surface "Latest Auto News" right on the Hero
const CARANDBIKE_RSS = "https://www.carandbike.com/rss/news";
const RSS_TO_JSON_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(CARANDBIKE_RSS)}`;

export default function HomePage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [news, setNews] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);

    const searchRef = useRef(null);

    useEffect(() => {
        // Fetch live editorial feed from our own robust backend
        // We pick a mix of Indian and global power-sources
        const channels = 'autocar-india,motorbeam,electrek,carscoops,the-drive';
        fetch(`${API_BASE_URL}/api/feed?channels=${channels}&limit=6`)
            .then(res => res.json())
            .then(data => {
                if (data.articles) {
                    setNews(data.articles);
                }
                setLoadingNews(false);
            })
            .catch(() => setLoadingNews(false));

        // Click outside listener for search suggestions
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search for live suggestions
    useEffect(() => {
        if (search.trim().length < 2) {
            window.queueMicrotask(() => {
                setSuggestions(prev => prev.length > 0 ? [] : prev);
                setShowSuggestions(prev => prev ? false : prev);
            });
            return;
        }

        const debounceTimer = setTimeout(() => {
            setIsSearching(true);
            fetch(`${API_BASE_URL}/api/db/search?q=${encodeURIComponent(search.trim())}`)
                .then(res => res.json())
                .then(data => {
                    // Only show top 5 matches
                    setSuggestions(data.cars?.slice(0, 5) || []);
                    setShowSuggestions(true);
                    setIsSearching(false);
                })
                .catch(err => {
                    console.error("Search fetch error:", err);
                    setIsSearching(false);
                });
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [search]);

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

                {/* ── TOP BLUEPRINT RULER ── */}
                <div className="hero-top-ruler">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="ruler-notch">
                            <span className="notch-label">{i * 50}mm</span>
                        </div>
                    ))}
                </div>

                {/* ── MECHANICAL SOUL ANNOTATIONS ── */}
                <div className="hero-technical-callout hero-callout-tl">
                    <span className="callout-label">CHASSIS_CODE:</span> TX-CH-88
                </div>
                <div className="hero-technical-callout hero-callout-tr">
                    <span className="callout-label">FIRING_ORDER:</span> 1-3-7-2-6-5-4-8
                </div>
                <div className="hero-technical-callout hero-callout-bl">
                    <span className="callout-label">DRIVE_TRAIN:</span> AWD_ACTIVE
                </div>
                <div className="hero-technical-callout hero-callout-br">
                    <span className="callout-label">ENGINE_MAP:</span> STAGE_2_RACE
                </div>

                <div className="container hero-content">
                    <div className="tech-measure-line" style={{ width: '200px', top: '-60px', left: '0' }}>
                        <span className="tech-measure-label">WHEELBASE_7.4FT</span>
                    </div>

                    <div className="animate-fade-in-up">
                        <span className="badge badge-glow editorial-badge">
                            <Zap size={14} /> The Ultimate Indian Auto Authority
                        </span>
                        <h1 className="editorial-headline">
                            Drive into the <span className="hero-highlight">Future.</span>
                        </h1>
                        <p className="hero-description">
                            Expert reviews, real-world data, and the most comprehensive car catalog in India—all powered by TorqueX Autos intelligence.
                        </p>
                    </div>

                    {/* Global Master Search Bar -> Routes to Catalog */}
                    <div className="home-search-wrapper animate-fade-in-up delay-1" ref={searchRef}>
                        <form className="home-search editorial-search" onSubmit={handleSearchSubmit}>
                            <Search size={22} className="search-icon" />
                            <input
                                type="text"
                                placeholder="What car are you looking for?"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onFocus={() => {
                                    if (suggestions.length > 0) setShowSuggestions(true);
                                }}
                            />
                            <button type="submit" className="search-submit">
                                <Zap size={16} /> IGNITE
                            </button>
                        </form>

                        {/* Search Suggestions Dropdown */}
                        {showSuggestions && (
                            <div className="search-suggestions-dropdown">
                                {isSearching ? (
                                    <div className="suggestions-loading">Searching database...</div>
                                ) : suggestions.length > 0 ? (
                                    <ul className="suggestions-list">
                                        {suggestions.map((car) => (
                                            <li key={car.id}>
                                                <button
                                                    className="suggestion-item"
                                                    onClick={() => navigate(`/car/${car.id}`)}
                                                >
                                                    <Car size={16} className="suggestion-icon" />
                                                    <div className="suggestion-info">
                                                        <span className="suggestion-name">{car.model_name}</span>
                                                        <span className="suggestion-brand">{car.brand}</span>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                        {/* Direct search shortcut */}
                                        <li className="suggestion-footer">
                                            <button onClick={handleSearchSubmit}>
                                                See all results for "{search}" <ChevronRight size={14} />
                                            </button>
                                        </li>
                                    </ul>
                                ) : search.trim().length >= 2 ? (
                                    <div className="suggestions-empty">No exact matches found</div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
                <LegendaryLapTicker />
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
                            <span className="tool-card-link">EXECUTE_MODULE <ChevronRight size={14} /></span>
                        </Link>
                        <Link to="/search" className="tool-card wiki-tool">
                            <div className="tool-card-icon">
                                <BookOpen size={24} />
                            </div>
                            <h3>Auto Encyclopedia</h3>
                            <p>Don't know what a dual-clutch is? Search our live technical dictionary.</p>
                            <span className="tool-card-link">EXECUTE_MODULE <ChevronRight size={14} /></span>
                        </Link>
                        <Link to="/news" className="tool-card news-tool">
                            <div className="tool-card-icon">
                                <Newspaper size={24} />
                            </div>
                            <h3>Top Auto News</h3>
                            <p>Stay updated with the latest launches, spy shots, and industry shifts.</p>
                            <span className="tool-card-link">EXECUTE_MODULE <ChevronRight size={14} /></span>
                        </Link>
                    </div>
                </section>

                <div className="mechanical-divider container" />

                {/* ── VIBE CHECK AI ── */}
                <section className="home-vibe-section animate-fade-in-up delay-3">
                    <div className="tech-watermark" style={{ top: '40%', left: '-2%' }}>V12</div>
                    <div className="section-header-editorial">
                        <h2>Personalized Matchmaker</h2>
                        <p>Let our AI find the perfect car for your exact lifestyle.</p>
                    </div>
                    <VibeCheck />
                </section>

                {/* ── TORQUE_PULSE // AUTO INTELLIGENCE ── */}
                <section className="home-pulse-section animate-fade-in-up delay-4">
                    <div className="section-header-editorial title-with-icon">
                        <TrendingUp size={28} className="text-primary" />
                        <h2>TorquePulse // Intelligence</h2>
                    </div>

                    <div className="pulse-grid">
                        <div className="pulse-main">
                            <h4 className="pulse-subtitle">LATEST_EDITORIAL</h4>
                            {loadingNews ? (
                                <div className="editorial-loading">Fetching latest stories...</div>
                            ) : (
                                <div className="editorial-news-grid">
                                    {(news && news.length > 0) ? news.slice(0, 6).map((item, idx) => (
                                        <a key={item.id || idx} href={item.url} target="_blank" rel="noreferrer" className="editorial-news-card">
                                            <div className="news-image-wrapper">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.title} />
                                                ) : (
                                                    <div className="placeholder-image"><Newspaper size={32} /></div>
                                                )}
                                            </div>
                                            <div className="news-content">
                                                <span className="news-date">
                                                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'LATEST'}
                                                </span>
                                                <h3>{item.title}</h3>
                                                <div className="read-more">Read Full Story <ChevronRight size={14} /></div>
                                            </div>
                                        </a>
                                    )) : (
                                        <div className="editorial-empty">
                                            <Activity size={32} />
                                            <p>Establishing live link to media houses... Please refresh in a moment.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="pulse-action">
                                <Link to="/news" className="pulse-btn">
                                    View Full Editorial Feed <ChevronRight size={18} />
                                </Link>
                            </div>
                        </div>

                        <div className="pulse-sidebar">
                            <CatalogHighlights />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}