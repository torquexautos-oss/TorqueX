import { useState } from 'react';
import { Search, BookOpen, AlertCircle, ChevronRight, Zap, Info } from 'lucide-react';
import './SearchPage.css';

const WIKI_API_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

const POPULAR_TOPICS = [
    'V8 Engine', 'Turbocharger', 'Dual-clutch transmission', 'Electric vehicle',
    'Advanced driver-assistance system', 'Anti-lock braking system',
    'Aerodynamics', 'Hybrid vehicle', 'Four-wheel drive'
];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchWikipediaArticle = async (searchQuery) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setError('');
        setArticle(null);

        try {
            // Use the Wikipedia REST API for clean summaries and extracts
            const response = await fetch(`${WIKI_API_URL}${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("We couldn't find an exact Wikipedia article for that term. Try using broader automotive terms.");
                }
                throw new Error("Failed to connect to Wikipedia. Please try again later.");
            }

            const data = await response.json();

            // Handle disambiguation pages
            if (data.type === 'disambiguation') {
                throw new Error("That term is too broad. Please try being more specific (e.g., 'V8 Engine' instead of just 'V8').");
            }

            setArticle({
                title: data.title,
                description: data.description || 'Automotive Topic',
                extractHtml: data.extract_html,
                thumbnail: data.thumbnail?.source,
                originalUrl: data.content_urls?.desktop?.page
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchWikipediaArticle(query);
    };

    const handleTopicClick = (topic) => {
        setQuery(topic);
        fetchWikipediaArticle(topic);
    };

    return (
        <main className="wiki-page">
            <div className="wiki-header-bg" />

            <div className="container wiki-container">
                <section className="wiki-hero animate-fade-in-up">
                    <span className="badge badge-glow">
                        <BookOpen size={12} /> The TorqueX Automotive Encyclopedia
                    </span>
                    <h1>Search the <span className="hero-highlight">Knowledge Base</span></h1>
                    <p className="hero-description">
                        Learn how cars work. Powered directly by the live Wikipedia REST API.
                    </p>

                    <form className="wiki-search-box" onSubmit={handleSearch}>
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search for car parts, history, or engineering concepts..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </section>

                {/* State: Error */}
                {error && (
                    <div className="wiki-error animate-fade-in-up">
                        <AlertCircle size={24} />
                        <p>{error}</p>
                    </div>
                )}

                {/* State: Article Found */}
                {article && !loading && (
                    <article className="wiki-article-card card animate-fade-in-up delay-1">
                        <div className="wiki-article-header">
                            <div className="wiki-article-titles">
                                <h2>{article.title}</h2>
                                <span className="wiki-article-subtitle">{article.description}</span>
                            </div>
                            <a href={article.originalUrl} target="_blank" rel="noreferrer" className="wiki-source-link">
                                Read full on Wikipedia <ChevronRight size={16} />
                            </a>
                        </div>

                        <div className="wiki-article-body">
                            {article.thumbnail && (
                                <img src={article.thumbnail} alt={article.title} className="wiki-thumbnail" />
                            )}
                            <div
                                className="wiki-extract content-fade"
                                dangerouslySetInnerHTML={{ __html: article.extractHtml }}
                            />
                        </div>
                    </article>
                )}

                {/* State: Default / Recommendations */}
                {!article && !loading && !error && (
                    <section className="wiki-explore animate-fade-in-up delay-2">
                        <div className="section-header">
                            <h2><Zap size={20} /> Popular Automotive Topics</h2>
                        </div>
                        <div className="wiki-topics-grid">
                            {POPULAR_TOPICS.map(topic => (
                                <button
                                    key={topic}
                                    className="wiki-topic-chip"
                                    onClick={() => handleTopicClick(topic)}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>

                        <div className="wiki-info-box card mt-12">
                            <Info size={24} className="text-secondary" />
                            <div>
                                <h3>How this works</h3>
                                <p>This page securely integrates with the official Wikimedia Foundation REST API. When you search, TorqueX fetches the live, CC-BY-SA licensed summary directly from English Wikipedia.</p>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
