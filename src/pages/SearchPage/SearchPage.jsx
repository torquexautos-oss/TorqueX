import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchPage.css';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [carCount, setCarCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/cars_full.json')
            .then((res) => res.json())
            .then((data) => setCarCount(data.length))
            .catch(() => setCarCount(0));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/cars${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    };

    const popularBrands = [
        'Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Kia',
        'Toyota', 'Mahindra', 'Ford', 'Renault', 'BMW',
    ];

    const categories = [
        { label: 'Hatchbacks', query: 'Hatchback' },
        { label: 'SUVs', query: 'SUV' },
        { label: 'Sedans', query: 'Sedan' },
        { label: 'MPVs', query: 'MPV' },
    ];

    return (
        <main className="search-page container">
            <div className="search-hero">
                <h1>Find the right car</h1>
                <p>{carCount} BS6-compliant cars. Real specs, honest pros &amp; cons, known problems.</p>

                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search by car name or brand..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button type="submit">Search</button>
                </form>
            </div>

            <section className="search-section">
                <h2>Browse by Brand</h2>
                <div className="brand-grid">
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

            <section className="search-section">
                <h2>Browse by Type</h2>
                <div className="brand-grid">
                    {categories.map((cat) => (
                        <button
                            key={cat.label}
                            className="brand-chip type-chip"
                            onClick={() => navigate(`/cars?type=${encodeURIComponent(cat.query)}`)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </section>
            <div className="browse-all">
                <button onClick={() => navigate('/cars')} className="browse-all-btn">
                    Browse all {carCount} cars →
                </button>
            </div>
        </main>
    );
}
