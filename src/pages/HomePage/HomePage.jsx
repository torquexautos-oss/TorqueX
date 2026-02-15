import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CarCard from '../../components/CarCard/CarCard';
import './HomePage.css';

const PAGE_SIZE = 20;

export default function HomePage() {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const initialType = searchParams.get('type') || '';

    const [allCars, setAllCars] = useState([]);
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialQuery);
    const [brandFilter, setBrandFilter] = useState('');
    const [fuelFilter, setFuelFilter] = useState('');
    const [bodyFilter, setBodyFilter] = useState(initialType);
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetch('/cars_full.json')
            .then((res) => res.json())
            .then((data) => {
                setAllCars(data);
                setLoading(false);
            });
    }, []);

    // Derived filter options
    const brands = useMemo(() => [...new Set(allCars.map((c) => c.brand))].sort(), [allCars]);
    const fuels = useMemo(() => [...new Set(allCars.map((c) => c.fuelType))].sort(), [allCars]);
    const bodies = useMemo(() => [...new Set(allCars.map((c) => c.bodyType))].sort(), [allCars]);

    // Filter + sort
    const filteredCars = useMemo(() => {
        let result = allCars;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.brand.toLowerCase().includes(q)
            );
        }
        if (brandFilter) result = result.filter((c) => c.brand === brandFilter);
        if (fuelFilter) result = result.filter((c) => c.fuelType === fuelFilter);
        if (bodyFilter) result = result.filter((c) => c.bodyType === bodyFilter);

        if (sortBy === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
        else result = [...result].sort((a, b) => (b.year || 0) - (a.year || 0));

        return result;
    }, [allCars, search, brandFilter, fuelFilter, bodyFilter, sortBy]);

    const visibleCars = filteredCars.slice(0, visible);
    const hasMore = visible < filteredCars.length;

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
                    {filteredCars.length} of {allCars.length} cars
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
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low → High</option>
                    <option value="price-high">Price: High → Low</option>
                </select>

                {(search || brandFilter || fuelFilter || bodyFilter) && (
                    <button className="reset-btn" onClick={handleReset}>Reset</button>
                )}
            </div>

            {/* Car Grid */}
            {visibleCars.length > 0 ? (
                <div className="car-grid">
                    {visibleCars.map((car) => (
                        <CarCard key={car.id} car={car} />
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
                        Load More ({filteredCars.length - visible} remaining)
                    </button>
                </div>
            )}
        </main>
    );
}