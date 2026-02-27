import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, Fuel, Gauge, Users, Car, Zap, BarChart3, Shield, Newspaper } from 'lucide-react';
import './SearchPage.css';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [allCars, setAllCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:3002/api/cars')
            .then((res) => res.json())
            .then((data) => {
                setAllCars(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Derived stats
    const stats = useMemo(() => {
        const brands = new Set(allCars.map(c => c.brand));
        const bodies = new Set(allCars.map(c => c.bodyType));
        const fuels = new Set(allCars.map(c => c.fuelType));
        return {
            totalCars: allCars.length,
            totalBrands: brands.size,
            bodyTypes: bodies.size,
            fuelTypes: fuels.size,
        };
    }, [allCars]);

    // Featured cars — pick 6 popular ones spread across price range
    const featuredCars = useMemo(() => {
        if (allCars.length === 0) return [];
        const popular = ['Nexon', 'Creta', 'Thar', 'Swift', 'XUV700', 'Fortuner', 'Taigun', 'Seltos'];
        const matches = [];
        for (const name of popular) {
            const car = allCars.find(c => c.name?.toLowerCase().includes(name.toLowerCase()));
            if (car && matches.length < 6) matches.push(car);
        }
        // Fill with random if needed
        if (matches.length < 6) {
            const rest = allCars.filter(c => !matches.includes(c)).slice(0, 6 - matches.length);
            matches.push(...rest);
        }
        return matches;
    }, [allCars]);

    // Brand list
    const brands = useMemo(() => {
        const brandNames = [...new Set(allCars.map(c => c.brand))].sort();
        return brandNames.slice(0, 14);
    }, [allCars]);

    // Body type categories with icons
    const categories = [
        { label: 'SUVs', query: 'SUV', icon: <Car size={28} /> },
        { label: 'Hatchbacks', query: 'Hatchback', icon: <Car size={28} /> },
        { label: 'Sedans', query: 'Sedan', icon: <Car size={28} /> },
        { label: 'MPVs/Minivans', query: 'MPV/Minivan', icon: <Users size={28} /> },
        { label: 'Coupes', query: 'Coupe', icon: <Car size={28} /> },
        { label: 'Convertibles', query: 'Convertible', icon: <Car size={28} /> },
    ];

    // Body type counts
    const bodyCounts = useMemo(() => {
        const counts = {};
        allCars.forEach(c => {
            counts[c.bodyType] = (counts[c.bodyType] || 0) + 1;
        });
        return counts;
    }, [allCars]);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/cars${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    };

    const formatPrice = (price) => {
        if (!price) return '';
        if (price >= 10000000) return `₹ ${(price / 10000000).toFixed(2)} Cr`;
        if (price >= 100000) return `₹ ${(price / 100000).toFixed(2)} L`;
        return `₹ ${price.toLocaleString('en-IN')}`;
    };

    return (
        <main className="hero-page">
            {/* ── Hero Section ──────────────────────────────────────── */}
            <section className="hero-section">
                <div className="hero-bg-gradient" />
                <div className="hero-content container">
                    <div className="hero-text animate-fade-in-up">
                        <span className="badge badge-blue">
                            <Zap size={12} /> India's Premium Auto Intelligence
                        </span>
                        <h1>
                            Find Your Perfect <span className="hero-highlight">Dream Car</span>
                        </h1>
                        <p className="hero-description">
                            Real specs, honest pros & cons, AI-powered insights.
                            Compare {stats.totalBrands}+ brands, {stats.totalCars} variants — all in one place.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="hero-search animate-fade-in-up delay-1">
                        <form className="hero-search-inner" onSubmit={handleSearch}>
                            <Search size={20} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by car name, brand, or type..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="btn btn-primary">Search</button>
                        </form>
                    </div>


                </div>
            </section>

            <div className="container">
                {/* ── Browse by Category ────────────────────────────────── */}
                <section className="section animate-fade-in-up delay-3">
                    <div className="section-header">
                        <h2>Browse by Category</h2>
                        <Link to="/cars" className="section-link">
                            View all <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="category-grid">
                        {categories.map((cat) => (
                            <div
                                key={cat.label}
                                className="category-card card"
                                onClick={() => navigate(
                                    cat.fuelFilter
                                        ? `/cars?q=${encodeURIComponent(cat.fuelFilter)}`
                                        : `/cars?type=${encodeURIComponent(cat.query)}`
                                )}
                            >
                                <div className="category-icon">{cat.icon}</div>
                                <span className="category-label">{cat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Featured Cars ─────────────────────────────────────── */}
                {featuredCars.length > 0 && (
                    <section className="section animate-fade-in-up delay-4">
                        <div className="section-header">
                            <h2>Featured Cars</h2>
                            <Link to="/cars" className="section-link">
                                Explore all <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="featured-grid">
                            {featuredCars.map((car) => (
                                <Link
                                    key={car.id}
                                    to={`/car/${car.id}`}
                                    className="featured-card card"
                                >
                                    <div className="featured-img">
                                        <img
                                            src={car.images?.[0] || '/images/placeholder-car.svg'}
                                            alt={car.name}
                                            loading="lazy"
                                            onError={(e) => { e.target.src = '/images/placeholder-car.svg'; }}
                                        />
                                    </div>
                                    <div className="featured-info">
                                        <span className="featured-brand">{car.brand}</span>
                                        <h3 className="featured-name">{car.name}</h3>
                                        <div className="featured-price">{car.priceRange || formatPrice(car.price)}</div>
                                        <div className="featured-specs">
                                            <span><Fuel size={13} /> {car.fuelType}</span>
                                            <span><Gauge size={13} /> {car.mileage} kmpl</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Browse by Brand ───────────────────────────────────── */}
                <section className="section animate-fade-in-up delay-5">
                    <div className="section-header">
                        <h2>Popular Brands</h2>
                        <Link to="/cars" className="section-link">
                            All brands <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="brands-grid">
                        {brands.map((brand) => (
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

                {/* ── Why TorqueX ───────────────────────────────────────── */}
                <section className="section">
                    <div className="section-header">
                        <h2>Why TorqueX?</h2>
                    </div>
                    <div className="highlights-grid">
                        <div className="highlight-card card">
                            <div className="highlight-icon-wrap"><BarChart3 size={24} /></div>
                            <h3>Real Specs, No Fluff</h3>
                            <p>Every figure is verified — engine CC, BHP, torque, mileage, tank capacity, ground clearance. No marketing filler.</p>
                            <Link to="/cars" className="highlight-link">
                                Browse specs <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="highlight-card card">
                            <div className="highlight-icon-wrap"><Shield size={24} /></div>
                            <h3>Safety First</h3>
                            <p>GNCAP & BNCAP crash-test ratings, airbag count, and real-world safety insights for every model. Know before you buy.</p>
                            <Link to="/cars" className="highlight-link">
                                Compare safety <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="highlight-card card">
                            <div className="highlight-icon-wrap"><Newspaper size={24} /></div>
                            <h3>AI-Powered News</h3>
                            <p>Live RSS feeds from 15+ channels — Autocar India, Electrek, Reddit, and more. AI summaries on demand, zero cost.</p>
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
