import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Search, ChevronRight, Zap, BarChart3, Shield, Newspaper,
    Car, Gauge, Fuel, Settings
} from 'lucide-react';
import VibeCheck from '../../components/VibeCheck/VibeCheck';
import './SearchPage.css';

const CATEGORIES = [
    { label: 'SUVs', icon: <Car size={24} />, query: 'SUV' },
    { label: 'Sedans', icon: <Gauge size={24} />, query: 'Sedan' },
    { label: 'Hatchbacks', icon: <Settings size={24} />, query: 'Hatchback' },
    { label: 'MPVs/Minivans', icon: <Fuel size={24} />, query: 'MPV/Minivan' },
    { label: 'Coupes', icon: <Car size={24} />, query: 'Coupe' },
    { label: 'Convertibles', icon: <Car size={24} />, query: 'Convertible' },
];

const BRANDS = [
    'Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Kia',
    'Toyota', 'Mahindra', 'Ford', 'Renault', 'BMW',
    'Mercedes-Benz', 'Volkswagen', 'Skoda', 'MG', 'Jeep',
];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [cars, setCars] = useState([]);
    const [stats, setStats] = useState({ totalCars: 0, totalBrands: 0, electricVariants: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch stats from DB
        fetch('http://localhost:3002/api/db/stats')
            .then(r => r.json())
            .then(data => setStats(data))
            .catch(() => { });
        // Fetch all cars for featured section
        fetch('http://localhost:3002/api/db/cars')
            .then(r => r.json())
            .then(data => setCars(data.cars || []))
            .catch(() => setCars([]));
    }, []);

    const featured = useMemo(() => {
        if (!cars.length) return [];
        const shuffled = [...cars].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 8);
    }, [cars]);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/cars${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    };

    return (
        <main className="hero-page">
            {/* ── Hero Section ─────────────────────────────────── */}
            <section className="hero-section">
                <div className="hero-bg-gradient" />
                <div className="hero-content container">
                    <div className="hero-text animate-fade-in-up">
                        <span className="badge badge-glow">
                            <Zap size={12} /> India's most detailed car database
                        </span>
                        <h1>Find your <span className="hero-highlight">perfect car</span></h1>
                        <p className="hero-description">
                            {stats.total} BS6-compliant cars with real specs, honest pros &amp; cons,
                            known problems, and AI-powered insights.
                        </p>
                    </div>

                    <form className="hero-search animate-fade-in-up delay-1" onSubmit={handleSearch}>
                        <div className="hero-search-inner">
                            <Search size={20} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by car name, brand, or type..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="btn btn-primary">Search</button>
                        </div>
                    </form>
                    {/* Inject Epic Vibe Check AI Feature */}
                    <div className="sp-vibecheck-wrapper" style={{ marginTop: '2rem' }}>
                        <VibeCheck />
                    </div>


                </div>
            </section>

            <div className="container">
                {/* ── Browse by Type ──────────────────────────────── */}
                <section className="section animate-fade-in-up delay-3">
                    <div className="section-header">
                        <h2>Browse by Type</h2>
                        <Link to="/cars" className="section-link">
                            View all <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="category-grid">
                        {CATEGORIES.map(cat => (
                            <div
                                key={cat.label}
                                className="category-card card"
                                onClick={() => navigate(`/cars?type=${encodeURIComponent(cat.query)}`)}
                            >
                                <span className="category-icon">{cat.icon}</span>
                                <span className="category-label">{cat.label}</span>
                                <span className="category-count">
                                    {cars.filter(c => (c.bodyType || '').toLowerCase().includes(cat.query.toLowerCase())).length} cars
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Popular Brands ──────────────────────────────── */}
                <section className="section animate-fade-in-up delay-4">
                    <div className="section-header">
                        <h2>Popular Brands</h2>
                    </div>
                    <div className="brands-grid">
                        {BRANDS.map(brand => (
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

                {/* ── Featured Cars ───────────────────────────────── */}
                {featured.length > 0 && (
                    <section className="section animate-fade-in-up delay-5">
                        <div className="section-header">
                            <h2>Featured Cars</h2>
                            <Link to="/cars" className="section-link">
                                Browse all <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="featured-grid">
                            {featured.map(car => (
                                <Link
                                    key={car.modelId || car.name}
                                    to={`/car/${car.brand?.toLowerCase().replace(/\s+/g, '-')}/${car.modelId}`}
                                    className="featured-card card"
                                >
                                    <div className="featured-info">
                                        <span className="featured-brand">{car.brand}</span>
                                        <span className="featured-name">{car.name}</span>
                                        {car.price && <span className="featured-price">{car.price}</span>}
                                        <div className="featured-specs">
                                            {car.fuelType && <span><Fuel size={12} /> {car.fuelType}</span>}
                                            {car.transmission && <span><Settings size={12} /> {car.transmission}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Why TorqueX ─────────────────────────────────── */}
                <section className="section animate-fade-in-up">
                    <div className="section-header">
                        <h2>Why TorqueX?</h2>
                    </div>
                    <div className="highlights-grid">
                        <div className="highlight-card card">
                            <div className="highlight-icon-wrap"><BarChart3 size={22} /></div>
                            <h3>Real Data, No Fluff</h3>
                            <p>Every spec verified from official sources. No paid reviews, no sponsored rankings.</p>
                            <Link to="/cars" className="highlight-link">
                                Explore cars <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="highlight-card card">
                            <div className="highlight-icon-wrap"><Shield size={22} /></div>
                            <h3>Known Problems Listed</h3>
                            <p>We list the actual issues owners report — not just the good stuff.</p>
                            <Link to="/compare" className="highlight-link">
                                Compare cars <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="highlight-card card">
                            <div className="highlight-icon-wrap"><Newspaper size={22} /></div>
                            <h3>Live Auto News</h3>
                            <p>15 channels of live RSS news from top automotive sources, updated every 15 minutes.</p>
                            <Link to="/news" className="highlight-link">
                                Read news <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
