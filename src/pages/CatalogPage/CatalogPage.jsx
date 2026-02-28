import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CarCard from '../../components/CarCard/CarCard';
import BrandChannelGrid from '../../components/BrandChannelGrid/BrandChannelGrid';
import { Search, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import './CatalogPage.css';

const PAGE_SIZE = 24;

export default function CatalogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const initialBrand = searchParams.get('brand') || '';
    const initialType = searchParams.get('type') || '';

    const [allCars, setAllCars] = useState([]);
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialQuery);
    const [brandFilter, setBrandFilter] = useState(initialBrand);
    const [fuelFilter, setFuelFilter] = useState('');
    const [bodyFilter, setBodyFilter] = useState(initialType);
    const [budgetFilter, setBudgetFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const isChannelView = !brandFilter && !search && !fuelFilter && !bodyFilter && !budgetFilter;

    const [brands, setBrands] = useState([]);
    const [fuels, setFuels] = useState(['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']);
    const [bodies, setBodies] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3002/api/db/cars')
            .then(res => res.json())
            .then(data => {
                setAllCars(data.cars || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        fetch('http://localhost:3002/api/db/brands')
            .then(res => res.json())
            .then(data => setBrands(data.brands || []));

        fetch('http://localhost:3002/api/db/stats')
            .then(res => res.json())
            .then(data => setBodies(data.bodyTypes || []));

        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 800) {
                setVisible(v => v + PAGE_SIZE);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const brandQuery = searchParams.get('brand');
        if (brandQuery && brandQuery !== brandFilter) {
            setBrandFilter(brandQuery);
            setVisible(PAGE_SIZE);
        }
    }, [searchParams]);

    const filteredModels = useMemo(() => {
        let result = allCars;
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
        if (fuelFilter) result = result.filter((m) => m.fuelType === fuelFilter || m.fuelType?.includes(fuelFilter));

        if (budgetFilter) {
            const [min, max] = budgetFilter.split('-').map(Number);
            result = result.filter(m => {
                if (!m.price_min) return false;
                if (max) return m.price_min >= min && m.price_min <= max;
                return m.price_min >= min;
            });
        }

        // Primary sort by chosen option
        if (sortBy === 'price-low') result = [...result].sort((a, b) => (a.price_min || 999) - (b.price_min || 999));
        else if (sortBy === 'price-high') result = [...result].sort((a, b) => (b.price_max || 0) - (a.price_max || 0));
        else if (sortBy === 'newest') result = [...result].sort((a, b) => (b.launch_year || 0) - (a.launch_year || 0));
        else result = [...result].sort((a, b) => (a.price_min || 999) - (b.price_min || 999));

        // Always push Discontinued cars to the end
        result.sort((a, b) => {
            const aDisc = a.status === 'Discontinued' ? 1 : 0;
            const bDisc = b.status === 'Discontinued' ? 1 : 0;
            return aDisc - bDisc;
        });

        return result;
    }, [allCars, search, brandFilter, bodyFilter, fuelFilter, budgetFilter, sortBy]);

    const visibleModels = filteredModels.slice(0, visible);
    const hasMore = visible < filteredModels.length;

    const handleReset = () => {
        setSearch('');
        setBrandFilter('');
        setFuelFilter('');
        setBodyFilter('');
        setBudgetFilter('');
        setSortBy('newest');
        setVisible(PAGE_SIZE);
        if (searchParams.toString() !== '') {
            setSearchParams({});
        }
    };

    if (loading) {
        return (
            <main className="catalog-page container">
                <p className="loading-text">Loading catalog...</p>
            </main>
        );
    }

    return (
        <main className="catalog-page container">
            <div className="catalog-header">
                <h1>Car Catalog</h1>
                <p className="catalog-subtitle">
                    {filteredModels.length} models matching criteria
                </p>
            </div>

            <div className="catalog-search">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search by car name or brand..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
                />
            </div>

            {!isChannelView && (
                <div className="catalog-filters">
                    <SlidersHorizontal size={18} className="filter-icon" />
                    <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setVisible(PAGE_SIZE); }}>
                        <option value="">All Brands</option>
                        {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
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

                    <select value={budgetFilter} onChange={(e) => { setBudgetFilter(e.target.value); setVisible(PAGE_SIZE); }}>
                        <option value="">Any Budget</option>
                        <option value="0-10">Under ₹10 Lakh</option>
                        <option value="10-20">₹10L - ₹20 Lakh</option>
                        <option value="20-30">₹20L - ₹30 Lakh</option>
                        <option value="30-50">₹30L - ₹50 Lakh</option>
                        <option value="50-1000">Above ₹50 Lakh</option>
                    </select>

                    {(search || brandFilter || fuelFilter || bodyFilter || budgetFilter) && (
                        <button className="reset-btn" onClick={handleReset}>Reset</button>
                    )}
                </div>
            )}

            {isChannelView ? (
                <section style={{ margin: '4rem 0' }} className="animate-fade-in-up">
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Official Brand Channels</h2>
                    <BrandChannelGrid brands={brands} />
                </section>
            ) : (
                <>
                    {brandFilter && !search && !fuelFilter && !bodyFilter && !budgetFilter && (
                        <div className="brand-channel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 2rem 0', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: 'bold' }} title="Back to Channels">
                                    <ArrowLeft size={20} />
                                </button>
                                <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#fff' }}>{brandFilter} Catalog</h2>
                            </div>
                            <span style={{ background: 'rgba(102, 192, 244, 0.1)', color: 'var(--accent-primary)', padding: '0.4rem 1rem', borderRadius: '6px', fontWeight: 'bold' }}>
                                {filteredModels.length} Models
                            </span>
                        </div>
                    )}

                    {visibleModels.length > 0 ? (
                        <div className="car-grid">
                            {visibleModels.map((model) => (
                                <CarCard key={model.slug || model.id} car={model} />
                            ))}
                        </div>
                    ) : (
                        <div className="no-results">
                            <p>No cars match your filters.</p>
                            <button onClick={handleReset}>Reset Filters</button>
                        </div>
                    )}

                    {hasMore && (
                        <div className="load-more">
                            <button onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                                Loading more cars... ({filteredModels.length - visible} remaining)
                            </button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
