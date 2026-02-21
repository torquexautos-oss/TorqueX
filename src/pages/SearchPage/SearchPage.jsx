import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, TrendingUp, Fuel, Gauge, Car, ChevronRight, Zap, Newspaper, ArrowRight } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import CarImage from '../../components/CarImage/CarImage';
import './SearchPage.css';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/cars_full.json')
            .then((res) => res.json())
            .then((data) => { setCars(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/cars${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    };

    const featuredCars = cars.slice(0, 8);
    const brands = [...new Set(cars.map(c => c.brand))].sort();
    const totalBrands = brands.length;
    const bodyTypes = [...new Set(cars.map(c => c.bodyType))];

    const categories = [
        { label: 'SUVs', query: 'SUV', icon: Car, count: cars.filter(c => c.bodyType === 'SUV').length },
        { label: 'Sedans', query: 'Sedan', icon: Car, count: cars.filter(c => c.bodyType === 'Sedan').length },
        { label: 'Hatchbacks', query: 'Hatchback', icon: Car, count: cars.filter(c => c.bodyType === 'Hatchback').length },
        { label: 'MPVs', query: 'MPV', icon: Car, count: cars.filter(c => c.bodyType === 'MPV').length },
    ];

    const popularBrands = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Kia', 'Toyota', 'Mahindra', 'BMW', 'Mercedes-Benz', 'Volkswagen'];

    return (
        <main className="hero-page">
            {/* ── Hero Section ──────────────────────── */}
            <section className="hero-section">
                <div className="hero-bg-gradient" />
                <div className="hero-content container-wide">
                    <div className="hero-text animate-fade-in-up">
                        <span className="badge badge-blue">Powered by AI</span>
                        <h1>Find Your Perfect<br /><span className="hero-highlight">Drive</span></h1>
                        <p className="hero-description">
                            Explore {cars.length}+ cars across {totalBrands} brands with real specifications,
                            honest reviews, and AI-powered recommendations.
                        </p>

                        <form className="hero-search" onSubmit={handleSearch}>
                            <div className="hero-search-inner">
                                <Search size={20} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by car name, brand, or type..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary">
                                    Search
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Quick Stats */}
                    <div className="hero-stats animate-fade-in-up delay-2">
                        <div className="stat-card">
                            <span className="stat-number">{cars.length}</span>
                            <span className="stat-label">Cars Listed</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{totalBrands}</span>
                            <span className="stat-label">Brands</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{bodyTypes.length}</span>
                            <span className="stat-label">Body Types</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">24/7</span>
                            <span className="stat-label">AI Updates</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Browse by Category ────────────────── */}
            <section className="section container-wide">
                <div className="section-header">
                    <h2>Browse by Type</h2>
                    <Link to="/cars" className="section-link">View All <ChevronRight size={16} /></Link>
                </div>
                <div className="category-grid">
                    {categories.map((cat) => (
                        <button
                            key={cat.label}
                            className="category-card card"
                            onClick={() => navigate(`/cars?type=${encodeURIComponent(cat.query)}`)}
                        >
                            <cat.icon size={28} className="category-icon" />
                            <span className="category-label">{cat.label}</span>
                            <span className="category-count">{cat.count} cars</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Featured Cars ─────────────────────── */}
            {!loading && featuredCars.length > 0 && (
                <section className="section container-wide">
                    <div className="section-header">
                        <h2>Featured Cars</h2>
                        <Link to="/cars" className="section-link">See All <ChevronRight size={16} /></Link>
                    </div>
                    <div className="featured-grid">
                        {featuredCars.map((car) => (
                            <Link to={`/car/${car.id}`} key={car.id} className="featured-card card">
                                <div className="featured-img">
                                    <CarImage
                                        brand={car.brand}
                                        modelId={car.id}
                                        name={car.name}
                                    />
                                </div>
                                <div className="featured-info">
                                    <span className="featured-brand">{car.brand}</span>
                                    <h3 className="featured-name">{car.name}</h3>
                                    <p className="featured-price">{formatPrice(car.price)}</p>
                                    <div className="featured-specs">
                                        <span><Fuel size={13} /> {car.fuelType}</span>
                                        <span><Gauge size={13} /> {car.engine}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Popular Brands ────────────────────── */}
            <section className="section container-wide">
                <div className="section-header">
                    <h2>Popular Brands</h2>
                </div>
                <div className="brands-grid">
                    {popularBrands.map((brand) => (
                        <button
                            key={brand}
                            className="brand-chip"
                            onClick={() => navigate(`/cars?q=${encodeURIComponent(brand)}`)}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Feature Highlights ────────────────── */}
            <section className="section container-wide">
                <div className="highlights-grid">
                    <div className="highlight-card card">
                        <div className="highlight-icon-wrap">
                            <Zap size={24} />
                        </div>
                        <h3>AI Recommendations</h3>
                        <p>Tell us your preferences and budget. Our AI finds your perfect match from {cars.length}+ cars instantly.</p>
                        <Link to="/recommend" className="highlight-link">Try Now <ArrowRight size={14} /></Link>
                    </div>
                    <div className="highlight-card card">
                        <div className="highlight-icon-wrap">
                            <Newspaper size={24} />
                        </div>
                        <h3>AI Newswire</h3>
                        <p>Stay informed with auto-generated, premium articles on the latest Indian automotive trends and launches.</p>
                        <Link to="/news" className="highlight-link">Read Now <ArrowRight size={14} /></Link>
                    </div>
                    <div className="highlight-card card">
                        <div className="highlight-icon-wrap">
                            <TrendingUp size={24} />
                        </div>
                        <h3>Live Pricing</h3>
                        <p>Real-time on-road price scraping from Indian automotive markets, updated daily for every model.</p>
                        <Link to="/cars" className="highlight-link">Explore <ArrowRight size={14} /></Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
