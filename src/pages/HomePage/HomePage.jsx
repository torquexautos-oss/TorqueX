import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { groupCarsByModel } from '../../utils/carGrouper';
import CarCard from '../../components/CarCard/CarCard';
import './HomePage.css';

const PAGE_SIZE = 20;

export default function HomePage() {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const initialType = searchParams.get('type') || '';

    const [allCars, setAllCars] = useState([]);
    const [models, setModels] = useState([]);
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialQuery);
    const [brandFilter, setBrandFilter] = useState('');
    const [fuelFilter, setFuelFilter] = useState('');
    const [bodyFilter, setBodyFilter] = useState(initialType);
    const [sortBy, setSortBy] = useState('newest');

    // Filter options from API
    const [brands, setBrands] = useState([]);
    const [fuels, setFuels] = useState(['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']);
    const [bodies, setBodies] = useState([]);

    useEffect(() => {
        // Fetch all cars from DB
        fetch('http://localhost:3002/api/db/cars')
            .then(res => res.json())
            .then(data => {
                setAllCars(data.cars || []);
                setModels(data.cars || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Fetch brands and body types from DB
        fetch('http://localhost:3002/api/db/brands')
            .then(res => res.json())
            .then(data => setBrands(data.brands.map(b => b.name) || []));

        fetch('http://localhost:3002/api/db/stats')
            .then(res => res.json())
            .then(data => setBodies(data.bodyTypes || []));
    }, []);

    // Client-side filtering on the DB results
    const filteredModels = useMemo(() => {
        let result = models;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (m) =>
                    m.model_name.toLowerCase().includes(q) ||
                    m.brand.toLowerCase().includes(q)
            );
        }
        if (brandFilter) result = result.filter((m) => m.brand === brandFilter);
        if (bodyFilter) result = result.filter((m) => m.body_type === bodyFilter);

        // Sort
        if (sortBy === 'price-low') result = [...result].sort((a, b) => a.price_min - b.price_min);
        else if (sortBy === 'price-high') result = [...result].sort((a, b) => b.price_max - a.price_max);
        else result = [...result].sort((a, b) => a.price_min - b.price_min);

        return result;
    }, [models, search, brandFilter, bodyFilter, sortBy]);

    const visibleModels = filteredModels.slice(0, visible);
    const hasMore = visible < filteredModels.length;

    const handleReset = () => {
        setSearch('');
        setBrandFilter('');
        setFuelFilter('');
        setBodyFilter('');
        setSortBy('newest');
        setVisible(PAGE_SIZE);
    };

    if (loading) {
        return (
            <main className="home-page container">
                <p className="loading-text">Loading cars...</p>
            </main>
        );
    }

    return (
        <main className="home-page container">
            <div className="home-header">
                <h1>Cars in India</h1>
                <p className="home-subtitle">
                    {filteredModels.length} models &middot; {allCars.length} variants
                </p>
            </div>

            {/* Search */}
            <div className="home-search">
                <input
                    type="text"
                    placeholder="Search by car name or brand..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
                />
            </div>

            {/* Filters */}
            <div className="home-filters">
                <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setVisible(PAGE_SIZE); }}>
                    <option value="">All Brands</option>
                    {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                <select value={fuelFilter} onChange={(e) => { setFuelFilter(e.target.value); setVisible(PAGE_SIZE); }}>
                    <option value="">All Fuels</option>
                    {fuels.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>

                <select value={bodyFilter} onChange={(e) => { setBodyFilter(e.target.value); setVisible(PAGE_SIZE); }}>
                    <option value="">All Body Types</option>
                    {bodies.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setVisible(PAGE_SIZE); }}>
                    <option value="newest">Price: Low → High</option>
                    <option value="price-low">Price: Low → High</option>
                    <option value="price-high">Price: High → Low</option>
                    <option value="variants">Most Variants</option>
                </select>

                {(search || brandFilter || fuelFilter || bodyFilter) && (
                    <button className="reset-btn" onClick={handleReset}>Reset</button>
                )}
            </div>

            {/* Car Grid */}
            {visibleModels.length > 0 ? (
                <div className="car-grid">
                    {visibleModels.map((model) => (
                        <CarCard key={model.slug} car={model} />
                    ))}
                </div>
            ) : (
                <div className="no-results">
                    <p>No cars match your filters.</p>
                    <button onClick={handleReset}>Reset Filters</button>
                </div>
            )}

            {/* Load More */}
            {hasMore && (
                <div className="load-more">
                    <button onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                        Load More ({filteredModels.length - visible} remaining)
                    </button>
                </div>
            )}
        </main>
    );
}