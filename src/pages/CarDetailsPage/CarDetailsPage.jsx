import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatPrice, formatMileage } from '../../utils/formatters';
import CarImage from '../../components/CarImage/CarImage';
import ReviewsSection from '../ReviewsSection/ReviewsSection';
import PitchDeckModal from '../../components/PitchDeckModal/PitchDeckModal';
import DriveSimulator from '../../components/DriveSimulator/DriveSimulator';
import CostCalculator from '../../components/CostCalculator/CostCalculator';
import DepreciationSlider from '../../components/DepreciationSlider/DepreciationSlider';
import './CarDetailsPage.css';

export default function CarDetailsPage() {
    const { id } = useParams();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dynamicData, setDynamicData] = useState(null);
    const [dynamicLoading, setDynamicLoading] = useState(false);

    // Feature: Pitch Deck State
    const [showPitchDeck, setShowPitchDeck] = useState(false);
    const [showDriveSim, setShowDriveSim] = useState(false);

    // Feature: Variant Matrix
    const [showVariantMatrix, setShowVariantMatrix] = useState(false);

    // Selected variant index (for showing specific variant specs)
    const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:3002/api/db/cars/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then((data) => {
                setCar(data);
                setLoading(false);
                setSelectedVariantIdx(0);

                if (data) {
                    // Fetch dynamic real-time price
                    setDynamicLoading(true);
                    fetch(`http://localhost:3002/api/car/scrape?brand=${data.brand}&modelId=${data.id}&city=delhi`)
                        .then(res => res.json())
                        .then(fetchedData => {
                            if (!fetchedData.error) {
                                setDynamicData(fetchedData);
                            }
                        })
                        .catch(err => console.error(err))
                        .finally(() => setDynamicLoading(false));
                }
            })
            .catch(() => {
                setCar(null);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="not-found container">
                <p>Loading...</p>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="not-found container">
                <h2>Car not found</h2>
                <p>The car you're looking for doesn't exist in our database.</p>
                <Link to="/cars" className="link-back">← Back to listings</Link>
            </div>
        );
    }

    // ── Active variant (the one whose specs we display) ──
    const v = car.variants?.[selectedVariantIdx] || car.variants?.[0] || {};

    // Extract basic specs for AI prompt
    const pitchSpecs = {
        price: formatPrice((v.price_lakh || car.priceMin) * 100000),
        body: car.bodyType,
        seating: v.seating_capacity || car.seatingCapacity,
        boot: v.boot_space_l || car.bootSpace,
        mileage: v.mileage_kmpl ? `${v.mileage_kmpl} kmpl` : 'Average'
    };

    // Parse available colors from the selected variant
    const colorsList = v.available_colors
        ? v.available_colors.split(',').map(c => c.trim()).filter(Boolean)
        : [];

    // Helper to render a spec value or a styled N/A
    const spec = (val, suffix = '') => {
        if (val === null || val === undefined || val === '' || val === 'N/A') {
            return <span className="spec-na">—</span>;
        }
        return `${val}${suffix}`;
    };

    return (
        <div className="details-page">
            {/* ── Hero Section ────────────────────────────────────── */}
            <div className="hero">
                <div className="hero-inner container">
                    <div className="hero-image">
                        <CarImage
                            brand={car.brand}
                            modelId={car.id}
                            name={car.modelName}
                            showSource={true}
                        />
                    </div>
                    <div className="hero-info">
                        <nav className="breadcrumb">
                            <Link to="/">Home</Link>
                            <span>/</span>
                            <Link to="/cars">Cars</Link>
                            <span>/</span>
                            <span>{car.brand}</span>
                            <span>/</span>
                            <span className="current">{car.modelName}</span>
                        </nav>

                        <div className="hero-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <span className="hero-brand">{car.brand}</span>
                                <h1 className="hero-name">{car.modelName}</h1>
                            </div>

                            <div className="epic-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                {/* EPIC FEATURE 3: Drive Simulator Button */}
                                <button
                                    className="drive-sim-btn"
                                    onClick={() => setShowDriveSim(true)}
                                    style={{
                                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                                        color: 'white', border: 'none', padding: '10px 20px',
                                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    <span>Simulate Launch 🚀</span>
                                </button>

                                {/* EPIC FEATURE 2: Family Pitch Deck Button */}
                                <button
                                    className="pitch-deck-btn"
                                    onClick={() => setShowPitchDeck(true)}
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white', border: 'none', padding: '10px 20px',
                                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    <span>Convince Family 🤝</span>
                                </button>
                            </div>
                        </div>

                        {dynamicLoading ? (
                            <div className="dynamic-price-skeleton pulse">
                                <span className="skeleton-text short"></span>
                            </div>
                        ) : dynamicData ? (
                            <div className="dynamic-price-container">
                                <p className="hero-price dynamic">
                                    {dynamicData.onRoadPrice}
                                    <span className="price-suffix"> On-Road ({dynamicData.city})</span>
                                </p>
                                <a href={dynamicData.sourceUrl} target="_blank" rel="noopener noreferrer" className="live-source-link">
                                    <span className="live-dot"></span> Live Scraped Data
                                </a>
                            </div>
                        ) : car.status === 'Upcoming' || car.status === 'Discontinued' ? (
                            <div className={`hero-status-badge status-${car.status.toLowerCase()}`}>
                                {car.status} Model
                            </div>
                        ) : (
                            <p className="hero-price">
                                {formatPrice((v.price_lakh || car.priceMin) * 100000)}
                            </p>
                        )}

                        {!dynamicData && car.priceMin && car.priceMax && car.status === 'Active' && (
                            <p className="hero-price-range">₹{Number(car.priceMin).toFixed(2)} - {Number(car.priceMax).toFixed(2)} Lakh</p>
                        )}

                        {/* ── Variant Selector ──────────────────── */}
                        {car.variants && car.variants.length > 1 && (
                            <div className="variant-selector">
                                <div className="variant-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="variant-label">Select Variant ({car.variants.length})</span>
                                    <button
                                        className="compare-matrix-btn text-accent"
                                        onClick={() => setShowVariantMatrix(!showVariantMatrix)}
                                        style={{ background: 'transparent', border: '1px solid currentColor', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--accent-primary)' }}
                                    >
                                        {showVariantMatrix ? 'Hide Matrix' : 'Compare All Specs'}
                                    </button>
                                </div>
                                <div className="variant-list">
                                    {car.variants.map((variant, idx) => (
                                        <button
                                            key={variant.id}
                                            className={`variant-btn ${idx === selectedVariantIdx ? 'variant-btn--active' : ''}`}
                                            onClick={() => setSelectedVariantIdx(idx)}
                                        >
                                            <span className="variant-name">{variant.variant_name}</span>
                                            <span className="variant-price">{variant.price_lakh ? formatPrice(variant.price_lakh * 100000) : 'Price TBA'}</span>
                                        </button>
                                    ))}
                                </div>

                                {showVariantMatrix && (
                                    <div className="variant-matrix-container" style={{ marginTop: '1rem', overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <table className="variant-matrix" style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Variant Name</th>
                                                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Price</th>
                                                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Engine</th>
                                                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Trans.</th>
                                                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Mileage</th>
                                                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Airbags</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {car.variants.map((variant, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: i === selectedVariantIdx ? 'rgba(102, 192, 244, 0.08)' : 'transparent' }}
                                                        onClick={() => setSelectedVariantIdx(i)}
                                                    >
                                                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{variant.variant_name}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--accent-green)' }}>{variant.price_lakh ? formatPrice(variant.price_lakh * 100000) : '—'}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{variant.engine_displacement_cc ? variant.engine_displacement_cc + ' cc' : '—'}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{variant.transmission_type || '—'}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{variant.mileage_kmpl ? variant.mileage_kmpl + ' kmpl' : '—'}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{variant.airbags_count ?? '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="quick-specs">
                            <div className="qs-item">
                                <span className="qs-value">{dynamicData?.specs?.mileage || (v.mileage_kmpl ? `${v.mileage_kmpl} kmpl` : '—')}</span>
                                <span className="qs-label">Mileage</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{dynamicData?.specs?.fuelType || v.fuel_type || '—'}</span>
                                <span className="qs-label">Fuel</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{dynamicData?.specs?.engine || (v.engine_displacement_cc ? `${v.engine_displacement_cc} cc` : '—')}</span>
                                <span className="qs-label">Engine</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{dynamicData?.specs?.transmission || v.transmission_type || '—'}</span>
                                <span className="qs-label">Transmission</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content Sections ────────────────────────────────── */}
            <div className="details-content container">

                {/* Section Nav */}
                <nav className="section-nav">
                    <a href="#overview">Overview</a>
                    <a href="#specifications">Specs</a>
                    <a href="#dimensions">Dimensions</a>
                    <a href="#safety">Safety</a>
                    {colorsList.length > 0 && <a href="#colors">Colors</a>}
                    {(v.battery_capacity_kwh || v.range_km) && <a href="#ev-specs">EV Specs</a>}
                    <a href="#reviews">Reviews</a>
                </nav>

                {/* ── Overview ─────────────────────────────────────── */}
                <section className="section" id="overview">
                    <h2 className="section-heading">Overview</h2>
                    <p className="section-desc">{car.description}</p>
                    <div className="overview-grid">
                        <div className="overview-item">
                            <span className="ov-label">Body Type</span>
                            <span className="ov-value">{spec(car.bodyType)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Fuel Type</span>
                            <span className="ov-value">{spec(v.fuel_type)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Transmission</span>
                            <span className="ov-value">{spec(v.transmission_type)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Seating</span>
                            <span className="ov-value">{spec(v.seating_capacity || car.seatingCapacity, ' persons')}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Launch Year</span>
                            <span className="ov-value">{spec(car.launch_year)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Price Range</span>
                            <span className="ov-value">{car.priceMin && car.priceMax ? `₹${car.priceMin.toFixed(2)} - ${car.priceMax.toFixed(2)} Lakh` : <span className="spec-na">—</span>}</span>
                        </div>
                    </div>
                </section>

                {/* ── Cost Calculator ──────────────────────────────── */}
                <CostCalculator
                    carPriceLakh={v.price_lakh || car.priceMin}
                    mileageKmpl={v.mileage_kmpl}
                    fuelType={v.fuel_type}
                />

                {/* ── Depreciation Slider ──────────────────────────── */}
                <DepreciationSlider
                    basePriceLakh={v.price_lakh || car.priceMin}
                    brandName={car.brand}
                    carImageSrc={`http://localhost:3002/api/car/image?modelId=${car.id}`}
                />

                {/* ── Specifications ───────────────────────────────── */}
                <section className="section" id="specifications">
                    <h2 className="section-heading">Specifications</h2>
                    <p className="variant-indicator">Showing specs for: <strong>{v.variant_name || car.modelName}</strong></p>
                    <div className="spec-columns">
                        <table className="spec-table">
                            <caption>Engine & Performance</caption>
                            <tbody>
                                <tr><td className="st-key">Displacement</td><td className="st-val">{spec(v.engine_displacement_cc, ' cc')}</td></tr>
                                <tr><td className="st-key">Power</td><td className="st-val">{spec(v.power_output)}</td></tr>
                                <tr><td className="st-key">Torque</td><td className="st-val">{spec(v.torque)}</td></tr>
                                <tr><td className="st-key">Drivetrain</td><td className="st-val">{spec(v.drivetrain || v.transmission_type)}</td></tr>
                                <tr><td className="st-key">Mileage (ARAI)</td><td className="st-val">{spec(v.mileage_kmpl, ' kmpl')}</td></tr>
                            </tbody>
                        </table>
                        <table className="spec-table">
                            <caption>Capacity</caption>
                            <tbody>
                                <tr><td className="st-key">Boot Space</td><td className="st-val">{spec(v.boot_space_l || car.bootSpace, ' L')}</td></tr>
                                <tr><td className="st-key">Ground Clearance</td><td className="st-val">{spec(v.ground_clearance_mm || car.groundClearance, ' mm')}</td></tr>
                                <tr><td className="st-key">Seating</td><td className="st-val">{spec(v.seating_capacity || car.seatingCapacity, ' persons')}</td></tr>
                                <tr><td className="st-key">Body Type</td><td className="st-val">{spec(car.bodyType)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── Dimensions ───────────────────────────────────── */}
                {(v.length_mm || v.width_mm || v.height_mm || v.wheelbase_mm) && (
                    <section className="section" id="dimensions">
                        <h2 className="section-heading">Dimensions</h2>
                        <div className="dimensions-visual">
                            <div className="dim-grid">
                                <div className="dim-card">
                                    <span className="dim-icon">↔</span>
                                    <span className="dim-value">{spec(v.length_mm, ' mm')}</span>
                                    <span className="dim-label">Length</span>
                                </div>
                                <div className="dim-card">
                                    <span className="dim-icon">⇔</span>
                                    <span className="dim-value">{spec(v.width_mm, ' mm')}</span>
                                    <span className="dim-label">Width</span>
                                </div>
                                <div className="dim-card">
                                    <span className="dim-icon">↕</span>
                                    <span className="dim-value">{spec(v.height_mm, ' mm')}</span>
                                    <span className="dim-label">Height</span>
                                </div>
                                <div className="dim-card">
                                    <span className="dim-icon">⟷</span>
                                    <span className="dim-value">{spec(v.wheelbase_mm, ' mm')}</span>
                                    <span className="dim-label">Wheelbase</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Safety ───────────────────────────────────────── */}
                <section className="section" id="safety">
                    <h2 className="section-heading">Safety & Features</h2>
                    <div className="safety-grid">
                        <div className={`safety-card ${v.airbags_count ? 'safety-card--has' : ''}`}>
                            <span className="safety-icon">🛡️</span>
                            <span className="safety-value">{v.airbags_count ? `${v.airbags_count} Airbags` : '—'}</span>
                        </div>
                        <div className={`safety-card ${v.has_abs ? 'safety-card--has' : ''}`}>
                            <span className="safety-icon">🔒</span>
                            <span className="safety-value">{v.has_abs ? 'ABS ✓' : 'ABS —'}</span>
                        </div>
                        <div className={`safety-card ${v.has_adas ? 'safety-card--has' : ''}`}>
                            <span className="safety-icon">🤖</span>
                            <span className="safety-value">{v.has_adas ? 'ADAS ✓' : 'ADAS —'}</span>
                        </div>
                        <div className={`safety-card ${v.has_sunroof ? 'safety-card--has' : ''}`}>
                            <span className="safety-icon">☀️</span>
                            <span className="safety-value">{v.has_sunroof ? 'Sunroof ✓' : 'Sunroof —'}</span>
                        </div>
                    </div>
                </section>

                {/* ── EV Specs (conditional) ───────────────────────── */}
                {(v.battery_capacity_kwh || v.range_km) && (
                    <section className="section" id="ev-specs">
                        <h2 className="section-heading">⚡ Electric Vehicle Specs</h2>
                        <div className="ev-grid">
                            {v.battery_capacity_kwh && (
                                <div className="ev-card">
                                    <span className="ev-icon">🔋</span>
                                    <span className="ev-value">{v.battery_capacity_kwh} kWh</span>
                                    <span className="ev-label">Battery Capacity</span>
                                </div>
                            )}
                            {v.range_km && (
                                <div className="ev-card">
                                    <span className="ev-icon">🛣️</span>
                                    <span className="ev-value">{v.range_km} km</span>
                                    <span className="ev-label">Range</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── Available Colors ─────────────────────────────── */}
                {colorsList.length > 0 && (
                    <section className="section" id="colors">
                        <h2 className="section-heading">Available Colors</h2>
                        <div className="colors-grid">
                            {colorsList.map((color, i) => (
                                <div className="color-chip" key={i}>
                                    <span className="color-name">{color}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Customer Reviews ────────────────────────────── */}
                <ReviewsSection carId={car.id} />

                {/* Back */}
                <div className="details-back">
                    <Link to="/cars" className="link-back">← Browse All Cars</Link>
                </div>
            </div>

            {showPitchDeck && (
                <PitchDeckModal
                    carName={car.modelName}
                    specs={pitchSpecs}
                    onClose={() => setShowPitchDeck(false)}
                />
            )}

            {showDriveSim && (
                <DriveSimulator
                    carName={car.modelName}
                    powerBhp={parseInt(v.power_output) || 100}
                    fuelType={v.fuel_type}
                    onClose={() => setShowDriveSim(false)}
                />
            )}
        </div>
    );
}
