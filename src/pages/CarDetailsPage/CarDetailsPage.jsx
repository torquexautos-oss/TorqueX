import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Gauge, Users, Shield, Lock, Cpu, Sun, BatteryCharging, Route, Zap } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import CarImage from '../../components/CarImage/CarImage';
import PitchDeckModal from '../../components/PitchDeckModal/PitchDeckModal';
import DriveSimulator from '../../components/DriveSimulator/DriveSimulator';
import CostCalculator from '../../components/CostCalculator/CostCalculator';
import DepreciationSlider from '../../components/DepreciationSlider/DepreciationSlider';
import CommentsView from '../../components/CommentsView/CommentsView';
import { API_BASE_URL } from '../../config';
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
        fetch(`${API_BASE_URL}/api/db/cars/${id}`)
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
                    fetch(`${API_BASE_URL}/api/car/scrape?brand=${data.brand}&modelId=${data.id}&city=delhi`)
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
    const renderSpec = (val, suffix = '', fallback = '—') => {
        if (val === null || val === undefined || val === '' || val === 'N/A' || val === 0) {
            return <span className="spec-na">{fallback}</span>;
        }
        return `${val}${suffix}`;
    };

    return (
        <div className="details-page">
            {/* ── Hero Section ────────────────────────────────────── */}
            <div className="hero">
                <div className="hero-inner container">
                    <div className="cd-hero-image-side">
                        <div className="image-blueprint-overlay">
                            <span className="bp-coord bp-top">CHASSIS_SEC // {car.id.toUpperCase()}</span>
                            <span className="bp-coord bp-right">AXLE_ALIGN // 0.00°</span>
                        </div>
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
                            <Link to={`/cars?brand=${encodeURIComponent(car.brand)}`}>{car.brand}</Link>
                            <span>/</span>
                            <span className="current">{car.modelName}</span>
                        </nav>

                        <div className="hero-header-row">
                            <div>
                                <span className="hero-brand">{car.brand}</span>
                                <h1 className="hero-name">{car.modelName}</h1>
                            </div>

                            <div className="epic-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                {/* EPIC FEATURE 3: Drive Simulator Button */}
                                <button
                                    className="btn-machine drive-sim-btn"
                                    onClick={() => setShowDriveSim(true)}
                                >
                                    <Gauge size={16} />
                                    <span>Simulate Launch</span>
                                </button>

                                {/* EPIC FEATURE 2: Family Pitch Deck Button */}
                                <button
                                    className="btn-machine pitch-deck-btn"
                                    onClick={() => setShowPitchDeck(true)}
                                >
                                    <Users size={16} />
                                    <span>Convince Family</span>
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
                        ) : (v.price_lakh || car.priceMin) ? (
                            <p className="hero-price">
                                {formatPrice((v.price_lakh || car.priceMin) * 100000)}
                            </p>
                        ) : (
                            <p className="hero-price price-tba">Price TBA</p>
                        )}

                        {!dynamicData && car.priceMin && car.priceMax && car.status === 'Active' && (
                            <p className="hero-price-range">₹{Number(car.priceMin).toFixed(2)} - {Number(car.priceMax).toFixed(2)} Lakh</p>
                        )}

                        {/* ── Variant Selector ──────────────────── */}
                        {car.variants && car.variants.length > 1 && (
                            <div className="variant-selector">
                                <div className="variant-header-row">
                                    <span className="variant-label">Select Variant ({car.variants.length})</span>
                                    <button
                                        className="compare-matrix-btn text-accent"
                                        onClick={() => setShowVariantMatrix(!showVariantMatrix)}
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
                                    <div className="variant-matrix-container">
                                        <table className="variant-matrix">
                                            <thead>
                                                <tr>
                                                    <th>Variant Name</th>
                                                    <th>Price</th>
                                                    <th>Engine</th>
                                                    <th>Trans.</th>
                                                    <th>Mileage</th>
                                                    <th>Airbags</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {car.variants.map((variant, i) => (
                                                    <tr key={i}
                                                        className={i === selectedVariantIdx ? 'matrix-row--active' : ''}
                                                        onClick={() => setSelectedVariantIdx(i)}
                                                    >
                                                        <td className="m-name">{variant.variant_name}</td>
                                                        <td className="m-price">{variant.price_lakh ? formatPrice(variant.price_lakh * 100000) : '—'}</td>
                                                        <td className="m-spec">{variant.engine_displacement_cc ? variant.engine_displacement_cc + ' cc' : '—'}</td>
                                                        <td className="m-spec">{variant.transmission_type || '—'}</td>
                                                        <td className="m-spec">{variant.mileage_kmpl ? variant.mileage_kmpl + ' kmpl' : '—'}</td>
                                                        <td className="m-spec">{variant.airbags_count ?? '—'}</td>
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
                                <span className="qs-value">{renderSpec(dynamicData?.specs?.mileage || v.mileage_kmpl, ' kmpl')}</span>
                                <span className="qs-label">Mileage</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{renderSpec(dynamicData?.specs?.fuelType || v.fuel_type)}</span>
                                <span className="qs-label">Fuel</span>
                            </div>
                            <div className="qs-item spec-with-flavor">
                                <span className="qs-value">{renderSpec(v.engine_displacement_cc, ' cc')}</span>
                                <span className="qs-label">Displacement</span>
                                <div className="spec-flavor-tag">{car.bodyType === 'EV' ? 'VOLTAGE_LOAD' : 'FIRING_ORDER: 1-3-4-2'}</div>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{renderSpec(dynamicData?.specs?.transmission || v.transmission_type)}</span>
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
                    <a href="#cost">Cost</a>
                    <a href="#depreciation">Depreciation</a>
                    {(v.battery_capacity_kwh || v.range_km) && <a href="#ev-specs">EV Specs</a>}
                    {colorsList.length > 0 && <a href="#colors">Colors</a>}
                    <a href="#reviews">Reviews</a>
                </nav>

                {/* ── Overview ─────────────────────────────────────── */}
                <section className="section" id="overview">
                    <h2 className="section-heading">Overview</h2>
                    <p className="section-desc">{car.description}</p>
                    <div className="overview-grid">
                        <div className="overview-item">
                            <span className="ov-label">Body Type</span>
                            <span className="ov-value">{renderSpec(car.bodyType)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Fuel Type</span>
                            <span className="ov-value">{renderSpec(v.fuel_type)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Transmission</span>
                            <span className="ov-value">{renderSpec(v.transmission_type)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Seating</span>
                            <span className="ov-value">{renderSpec(v.seating_capacity || car.seatingCapacity, ' persons')}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Launch Year</span>
                            <span className="ov-value">{renderSpec(car.launch_year)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Price Range</span>
                            <span className="ov-value">{car.priceMin && car.priceMax ? `₹${car.priceMin.toFixed(2)} - ${car.priceMax.toFixed(2)} Lakh` : renderSpec(null)}</span>
                        </div>
                    </div>
                </section>

                {/* ── Specifications ───────────────────────────────── */}
                <section className="section" id="specifications">
                    <h2 className="section-heading">Specifications</h2>
                    <p className="variant-indicator">Showing specs for: <strong>{v.variant_name || car.modelName}</strong></p>
                    <div className="spec-columns">
                        <table className="spec-table">
                            <caption>Engine & Performance</caption>
                            <tbody>
                                <tr><td className="st-key">Displacement</td><td className="st-val">{renderSpec(v.engine_displacement_cc, ' cc')}</td></tr>
                                <tr><td className="st-key">Power</td><td className="st-val">{renderSpec(v.power_output)}</td></tr>
                                <tr><td className="st-key">Torque</td><td className="st-val">{renderSpec(v.torque)}</td></tr>
                                <tr><td className="st-key">Drivetrain</td><td className="st-val">{renderSpec(v.drivetrain || v.transmission_type)}</td></tr>
                                <tr><td className="st-key">Mileage (ARAI)</td><td className="st-val">{renderSpec(v.mileage_kmpl, ' kmpl')}</td></tr>
                            </tbody>
                        </table>
                        <table className="spec-table">
                            <caption>Capacity</caption>
                            <tbody>
                                <tr><td className="st-key">Boot Space</td><td className="st-val">{renderSpec(v.boot_space_l || car.bootSpace, ' L')}</td></tr>
                                <tr><td className="st-key">Ground Clearance</td><td className="st-val">{renderSpec(v.ground_clearance_mm || car.groundClearance, ' mm')}</td></tr>
                                <tr><td className="st-key">Seating</td><td className="st-val">{renderSpec(v.seating_capacity || car.seatingCapacity, ' persons')}</td></tr>
                                <tr><td className="st-key">Body Type</td><td className="st-val">{renderSpec(car.bodyType)}</td></tr>
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
                                    <span className="dim-value">{renderSpec(v.length_mm, ' mm')}</span>
                                    <span className="dim-label">Length</span>
                                </div>
                                <div className="dim-card">
                                    <span className="dim-icon">⇔</span>
                                    <span className="dim-value">{renderSpec(v.width_mm, ' mm')}</span>
                                    <span className="dim-label">Width</span>
                                </div>
                                <div className="dim-card">
                                    <span className="dim-icon">↕</span>
                                    <span className="dim-value">{renderSpec(v.height_mm, ' mm')}</span>
                                    <span className="dim-label">Height</span>
                                </div>
                                <div className="dim-card">
                                    <span className="dim-icon">⟷</span>
                                    <span className="dim-value">{renderSpec(v.wheelbase_mm, ' mm')}</span>
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
                            <span className="safety-icon"><Shield size={20} /></span>
                            <span className="safety-value">{v.airbags_count ? `${v.airbags_count} Airbags` : '—'}</span>
                        </div>
                        <div className={`safety-card ${v.has_abs ? 'safety-card--has' : ''}`}>
                            <span className="safety-icon"><Lock size={20} /></span>
                            <span className="safety-value">{v.has_abs ? 'ABS ✓' : 'ABS —'}</span>
                        </div>
                        <div className={`safety-card ${v.has_adas ? 'safety-card--has' : ''}`}>
                            <span className="safety-icon"><Cpu size={20} /></span>
                            <span className="safety-value">{v.has_adas ? 'ADAS ✓' : 'ADAS —'}</span>
                        </div>
                        <div className={`safety-card ${v.has_sunroof ? 'safety-card--has' : ''}`}>
                            <span className="safety-icon"><Sun size={20} /></span>
                            <span className="safety-value">{v.has_sunroof ? 'Sunroof ✓' : 'Sunroof —'}</span>
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
                    modelId={car.id}
                    bodyType={car.bodyType}
                    fuelType={v.fuel_type}
                    carName={car.modelName}
                />

                {/* ── EV Specs (conditional) ───────────────────────── */}
                {(v.battery_capacity_kwh || v.range_km) && (
                    <section className="section" id="ev-specs">
                        <h2 className="section-heading"><Zap size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Electric Vehicle Specs</h2>
                        <div className="ev-grid">
                            {v.battery_capacity_kwh && (
                                <div className="ev-card">
                                    <span className="ev-icon"><BatteryCharging size={22} /></span>
                                    <span className="ev-value">{v.battery_capacity_kwh} kWh</span>
                                    <span className="ev-label">Battery Capacity</span>
                                </div>
                            )}
                            {v.range_km && (
                                <div className="ev-card">
                                    <span className="ev-icon"><Route size={22} /></span>
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

                {/* ── Comments / Reviews ────────────────────────────── */}
                <CommentsView targetId={`car_${car.id}`} type="car" />

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
