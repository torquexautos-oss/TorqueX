import { useState, useEffect } from 'react';
import { Search, BookOpen, AlertCircle, ChevronRight, Zap, Info } from 'lucide-react';
import './SearchPage.css';

const WIKI_API_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

const FUNNY_ERRORS = [
    "Woah there! We only do cars here, buddy. Did you mean to search for an engine?",
    "Nice try, but this is TorqueX, not Wikipedia. Give us a car-related term!",
    "Are you lost? Put the car in reverse and try searching for something with four wheels.",
    "BEEP BEEP! Irrelevant search detected. We only serve high-octane automotive knowledge.",
    "Error 404: Car Not Found. Your search crashed into a wall of irrelevance.",
    "Listen, I love learning too, but let's keep it to horsepower and torque, alright?"
];

const POPULAR_TOPICS = [
    'V8 Engine', 'Turbocharger', 'Dual-clutch transmission', 'Electric vehicle',
    'Advanced driver-assistance system', 'Anti-lock braking system',
    'Aerodynamics', 'Hybrid vehicle', 'Four-wheel drive'
];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [localCars, setLocalCars] = useState([]);
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Pre-fetch all known car models from TorqueX DB to provide instant local suggestions
        fetch('http://localhost:3002/api/db/cars')
            .then(res => res.json())
            .then(data => {
                if (data.cars) {
                    const uniqueNames = new Set(data.cars.map(c => `${c.brand_name} ${c.model_name}`));
                    setLocalCars(Array.from(uniqueNames));
                }
            })
            .catch(err => console.error("Failed to load local cars", err));
    }, []);

    useEffect(() => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            const qLower = query.toLowerCase();

            // 1. Get exact local car matches (insanely fast, guarantees strictly car-related hits)
            const localMatches = localCars
                .filter(c => c.toLowerCase().includes(qLower))
                .slice(0, 3);

            // 2. Supplement with Wikipedia generic concept matches (e.g. V8 Engine)
            try {
                const res = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json&origin=*`);
                const data = await res.json();
                const wikiMatches = data[1] || [];

                // Combine them without duplicates
                const combined = [...new Set([...localMatches, ...wikiMatches])].slice(0, 6);
                setSuggestions(combined);
            } catch (e) {
                setSuggestions(localMatches);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query, localCars]);

    const fetchWikipediaArticle = async (searchQuery) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setError('');
        setArticle(null);
        setShowSuggestions(false);

        try {
            // ---> FUZZY MATCHING PROXY ROUTE <---
            // Use Wikipedia's full search engine to resolve vague queries (like 'swift dzire') into an exact concept
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&utf8=&format=json&origin=*&srlimit=1`);
            const searchData = await searchRes.json();

            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                throw new Error("We couldn't find anything for that term in the encyclopedia. Try using broader automotive terms.");
            }

            // Extract the perfect noun result to feed into the strict Wikipedia Summary REST API
            const bestTitle = searchData.query.search[0].title;
            const pageId = searchData.query.search[0].pageid;

            // ---> SAFETY CHECK: FETCH CATEGORIES TO BLOCK IRRELEVANT TOPICS <---
            const catRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=categories|pageprops&titles=${encodeURIComponent(bestTitle)}&format=json&origin=*`);
            const catData = await catRes.json();

            let isRelevant = false;
            const pages = catData?.query?.pages;

            if (pages) {
                const pageInfo = Object.values(pages)[0];

                // 1. Check PageProps for "wikibase_item" to see if it's explicitly marked as a "human" (Q5) or similar, but the easiest proxy is just reading the categories.
                if (pageInfo && pageInfo.categories) {
                    const categories = pageInfo.categories.map(c => c.title.toLowerCase());
                    const combinedCategories = categories.join(" ");

                    // STRICT BLACKLIST: If it's a person, singer, album, movie, or fictional character -> Instant Ban
                    if (
                        combinedCategories.includes("births") ||
                        combinedCategories.includes("deaths") ||
                        combinedCategories.includes("singers") ||
                        combinedCategories.includes("musicians") ||
                        combinedCategories.includes("actors") ||
                        combinedCategories.includes("politicians") ||
                        combinedCategories.includes("albums") ||
                        combinedCategories.includes("films") ||
                        combinedCategories.includes("television")
                    ) {
                        isRelevant = false;
                    }
                    // STRICT WHITELIST: Must contain at least one of these core automotive/engineering concepts
                    else if (
                        combinedCategories.includes("automob") ||
                        combinedCategories.includes("vehicle") ||
                        combinedCategories.includes("car") ||
                        combinedCategories.includes("transport") ||
                        combinedCategories.includes("engine") ||
                        combinedCategories.includes("motors") ||
                        combinedCategories.includes("auto parts") ||
                        combinedCategories.includes("motorcycle") ||
                        combinedCategories.includes("racing") ||
                        combinedCategories.includes("mechanics")
                    ) {
                        isRelevant = true;
                    }

                    // IF IT FAILED THE CATCH-ALL CATEGORIES, check if the exact noun itself is an inherently automotive component
                    if (!isRelevant) {
                        const titleLower = bestTitle.toLowerCase();
                        if (
                            titleLower.includes("car") ||
                            titleLower.includes("engine") ||
                            titleLower.includes("motor") ||
                            titleLower.includes("transmission") ||
                            titleLower.includes("brake") ||
                            titleLower.includes("clutch") ||
                            titleLower.includes("tire") ||
                            titleLower.includes("suspension")
                        ) {
                            isRelevant = true;
                        }
                    }
                }
            }

            // If it's totally unrelated to our strict list, block it and throw a funny error
            if (!isRelevant) {
                const randomJoke = FUNNY_ERRORS[Math.floor(Math.random() * FUNNY_ERRORS.length)];
                throw new Error(randomJoke);
            }

            // ---> STRICT REST API FETCH <---
            const response = await fetch(`${WIKI_API_URL}${encodeURIComponent(bestTitle)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("We matched that text to a fuzzy concept, but it lacked a true summary. Try being more specific.");
                }
                throw new Error("Failed to connect to Wikipedia. Please try again later.");
            }

            const data = await response.json();

            // Handle ambiguous hubs (broad topics linking to other topics)
            if (data.type === 'disambiguation') {
                throw new Error(`The target "${bestTitle}" is too broad. Please try being slightly more specific.`);
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
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Search for car parts, history, or engineering concepts..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                autoFocus
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="search-suggestions">
                                    {suggestions.map((sug, idx) => (
                                        <li key={idx} onClick={() => {
                                            setQuery(sug);
                                            fetchWikipediaArticle(sug);
                                        }}>
                                            <Search size={14} /> {sug}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
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
