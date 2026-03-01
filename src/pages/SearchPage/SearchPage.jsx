import { useState, useEffect } from 'react';
import { Search, BookOpen, AlertCircle, ChevronRight, Zap, Info } from 'lucide-react';
import { API_BASE_URL } from '../../config';
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
        fetch(`${API_BASE_URL}/api/db/cars`)
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

            // ── Comprehensive Automotive Vocabulary ──────────────────
            const CATEGORY_WHITELIST = [
                // Vehicle types & industry
                "automob", "vehicle", "car ", "cars ", "truck", "bus ", "van ",
                "motorcycle", "motorbike", "scooter",
                // Engineering & mechanics
                "engine", "motor", "mechanics", "mechanical", "powertrain",
                "drivetrain", "transmission", "gearbox", "driveshaft",
                // Parts & components
                "chassis", "wheel", "tire", "tyre", "brake", "suspension",
                "steering", "exhaust", "muffler", "catalytic", "radiator",
                "alternator", "starter", "battery", "ignition", "spark plug",
                "camshaft", "crankshaft", "piston", "cylinder", "turbo",
                "supercharg", "intercooler", "carburetor", "fuel inject",
                "differential", "axle", "bearing", "gasket", "valve",
                "clutch", "flywheel", "torque converter",
                // Body & exterior
                "bumper", "fender", "hood", "bonnet", "windshield", "windscreen",
                "headlight", "taillight", "grille", "spoiler", "roof rack",
                "sunroof", "moonroof", "convertible top",
                // Interior & comfort
                "dashboard", "instrument panel", "airbag", "seatbelt",
                "infotainment", "head-up display", "upholstery",
                // Safety & assistance
                "safety", "driver", "driving", "adas", "cruise control",
                "anti-lock", "abs", "electronic stability", "traction control",
                "lane departure", "blind spot", "parking sensor", "collision",
                "autonomous", "self-driving",
                // Fuel & energy
                "fuel", "gasoline", "petrol", "diesel", "biodiesel",
                "electric vehicle", "hybrid", "hydrogen", "ev ", "phev",
                "charging station", "range anxiety",
                // Performance & dynamics
                "aerodynamic", "horsepower", "torque", "rpm",
                "acceleration", "top speed", "drag coefficient",
                "downforce", "oversteer", "understeer", "handling",
                // Racing & motorsport
                "racing", "motorsport", "formula one", "f1", "nascar",
                "rally", "le mans", "grand prix", "indianapolis",
                "drag race", "circuit", "pit stop",
                // Transport & roads
                "transport", "highway", "freeway", "traffic",
                "road", "intersection", "roundabout",
                // Manufacturers & industry
                "automaker", "car manufacturer", "dealership",
                "auto show", "motor show", "automotive industry",
                // Standards & regulations
                "emission", "euro ", "ncap", "crash test", "recall",
                "odometer", "speedometer", "tachometer",
            ];

            const TITLE_WHITELIST = [
                // Core terms
                "car", "auto", "vehicle", "motor", "engine", "truck", "bus",
                // Parts
                "wheel", "tire", "tyre", "brake", "clutch", "gear", "axle",
                "piston", "cylinder", "turbo", "supercharg", "exhaust",
                "suspension", "steering", "transmission", "drivetrain",
                "chassis", "bumper", "fender", "hood", "bonnet", "grille",
                "headlight", "taillight", "windshield", "windscreen",
                "radiator", "alternator", "starter", "camshaft", "crankshaft",
                "catalytic", "muffler", "differential", "flywheel",
                "spark plug", "fuel inject", "carburetor", "gasket", "valve",
                "driveshaft", "bearing", "rotor", "caliper", "strut",
                "shock absorber", "sway bar", "control arm", "tie rod",
                "ball joint", "cv joint", "u-joint", "torque converter",
                // Body
                "sedan", "hatchback", "suv", "coupe", "convertible",
                "wagon", "minivan", "pickup", "crossover", "roadster",
                "limousine", "cabriolet",
                // Safety & tech
                "airbag", "seatbelt", "abs", "adas", "cruise control",
                "driver", "driving", "autonomous", "self-driving",
                "lane departure", "blind spot", "parking sensor",
                "anti-lock", "traction control", "stability control",
                "collision", "crash test", "ncap", "safety",
                // Interior
                "dashboard", "infotainment", "sunroof", "moonroof",
                "head-up display", "instrument panel",
                // Fuel & energy
                "fuel", "gasoline", "petrol", "diesel", "hybrid",
                "electric", "hydrogen", "ev ", "phev", "battery",
                "charging", "range",
                // Performance
                "horsepower", "torque", "rpm", "acceleration",
                "aerodynamic", "downforce", "turbocharger",
                "supercharger", "intercooler", "nitrous",
                // Road & driving
                "highway", "traffic", "road", "speed limit",
                "odometer", "speedometer", "tachometer", "mileage",
                // Racing
                "racing", "motorsport", "formula", "nascar", "rally",
                "le mans", "grand prix", "drag race", "circuit",
                // Industry
                "automotive", "automaker", "dealership", "recall",
                "emission", "car manufacturer",
                // Motorcycle
                "motorcycle", "motorbike", "scooter", "moped",
            ];

            if (pages) {
                const pageInfo = Object.values(pages)[0];

                if (pageInfo && pageInfo.categories) {
                    const categories = pageInfo.categories.map(c => c.title.toLowerCase());
                    const combinedCategories = categories.join(" ");

                    // STRICT BLACKLIST: People, entertainment, fiction -> Instant Ban
                    if (
                        combinedCategories.includes("births") ||
                        combinedCategories.includes("deaths") ||
                        combinedCategories.includes("singers") ||
                        combinedCategories.includes("musicians") ||
                        combinedCategories.includes("actors") ||
                        combinedCategories.includes("politicians") ||
                        combinedCategories.includes("albums") ||
                        combinedCategories.includes("films") ||
                        combinedCategories.includes("television") ||
                        combinedCategories.includes("footballer") ||
                        combinedCategories.includes("cricketer") ||
                        combinedCategories.includes("novelist") ||
                        combinedCategories.includes("poet")
                    ) {
                        isRelevant = false;
                    }
                    // WHITELIST: Check categories against our comprehensive list
                    else if (CATEGORY_WHITELIST.some(kw => combinedCategories.includes(kw))) {
                        isRelevant = true;
                    }

                    // TITLE FALLBACK: Check if the article title itself is automotive
                    if (!isRelevant) {
                        const titleLower = bestTitle.toLowerCase();
                        if (TITLE_WHITELIST.some(kw => titleLower.includes(kw))) {
                            isRelevant = true;
                        }
                    }

                    // SEARCH QUERY FALLBACK: If the user's original query contains automotive terms, trust it
                    if (!isRelevant) {
                        const queryLower = searchQuery.toLowerCase();
                        if (TITLE_WHITELIST.some(kw => queryLower.includes(kw))) {
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
                                        <li key={idx} onMouseDown={(e) => {
                                            e.preventDefault(); // Prevents input blur from firing first
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
