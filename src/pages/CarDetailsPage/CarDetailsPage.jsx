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

    // Extract basic specs for AI prompt
    const pitchSpecs = {
        price: formatPrice((car.variants?.[0]?.price_lakh || car.price_min) * 100000),
        body: car.body_type,
        seating: car.seating_capacity,
        boot: car.boot_space_litres,
        mileage: car.variants?.[0]?.mileage_kmpl ? `${car.variants[0].mileage_kmpl} kmpl` : 'Average'
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
                            name={car.model_name}
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
                            <span className="current">{car.model_name}</span>
                        </nav>

                        <div className="hero-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <span className="hero-brand">{car.brand}</span>
                                <h1 className="hero-name">{car.model_name}</h1>
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
                                {formatPrice((car.variants?.[0]?.price_lakh || car.price_min) * 100000)}
                            </p>
                        )}

                        {!dynamicData && car.price_min && car.price_max && car.status === 'Active' && (
                            <p className="hero-price-range">₹{car.price_min} - {car.price_max} Lakh</p>
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
                                    {car.variants.map((v) => (
                                        <Link
                                            key={v.id}
                                            to={`/car/${car.id}?variant=${v.id}`}
                                            className={`variant-btn`}
                                            preventScrollReset={true}
                                        >
                                            <span className="variant-name">{v.variant_name}</span>
                                            <span className="variant-price">{formatPrice(v.price_lakh * 100000)}</span>
                                        </Link>
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
                                                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Sunroof</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {car.variants.map((v, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{v.variant_name}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--accent-green)' }}>{formatPrice(v.price_lakh * 100000)}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{v.engine_displacement_cc ? v.engine_displacement_cc + ' cc' : 'N/A'}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{v.transmission_type || 'N/A'}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{v.mileage_kmpl ? v.mileage_kmpl + ' kmpl' : 'N/A'}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: v.has_sunroof ? 'var(--accent-green)' : 'var(--text-muted)' }}>{v.has_sunroof ? 'Yes' : 'No'}</td>
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
                                <span className="qs-value">{dynamicData?.specs?.mileage || (car.variants?.[0]?.mileage_kmpl ? `${car.variants[0].mileage_kmpl} kmpl` : 'Efficiency Optimized')}</span>
                                <span className="qs-label">Mileage</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{dynamicData?.specs?.fuelType || car.variants?.[0]?.fuel_type || 'Multi-Fuel Ready'}</span>
                                <span className="qs-label">Fuel</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{dynamicData?.specs?.engine || (car.variants?.[0]?.engine_displacement_cc ? `${car.variants[0].engine_displacement_cc} cc` : 'Performance Tuned')}</span>
                                <span className="qs-label">Engine</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{dynamicData?.specs?.transmission || car.variants?.[0]?.transmission_type || 'Sync Gearbox'}</span>
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
                    <a href="#pros-cons">Pros & Cons</a>
                    <a href="#problems">Problems</a>
                    <a href="#maintenance">Maintenance</a>
                    <a href="#verdict">Verdict</a>
                    <a href="#reviews">Reviews</a>
                </nav>

                {/* ── Overview ─────────────────────────────────────── */}
                <section className="section" id="overview">
                    <h2 className="section-heading">Overview</h2>
                    <p className="section-desc">{car.description}</p>
                    <div className="overview-grid">
                        <div className="overview-item">
                            <span className="ov-label">Body Type</span>
                            <span className="ov-value">{car.body_type}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Fuel Type</span>
                            <span className="ov-value">{car.variants?.[0]?.fuel_type || 'N/A'}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Transmission</span>
                            <span className="ov-value">{car.variants?.[0]?.transmission || 'N/A'}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Seating</span>
                            <span className="ov-value">{car.seating_capacity} persons</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Emission</span>
                            <span className="ov-value">BS6 Phase 2</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Price Range</span>
                            <span className="ov-value">₹{car.price_min} - {car.price_max} Lakh</span>
                        </div>
                    </div>
                </section>

                {/* ── EPIC FEATURE 4: Cost Calculator ──────────────── */}
                <CostCalculator
                    carPriceLakh={car.variants?.[0]?.price_lakh || car.price_min}
                    mileageKmpl={car.variants?.[0]?.mileage_kmpl}
                    fuelType={car.variants?.[0]?.fuel_type}
                />

                {/* ── EPIC FEATURE 5: Depreciation Slider ──────────── */}
                <DepreciationSlider
                    basePriceLakh={car.variants?.[0]?.price_lakh || car.price_min}
                    brandName={car.brand}
                    carImageSrc={`http://localhost:3002/api/car/image?modelId=${car.id}`}
                />

                {/* ── Specifications ───────────────────────────────── */}
                <section className="section" id="specifications">
                    <h2 className="section-heading">Specifications</h2>
                    <div className="spec-columns">
                        <table className="spec-table">
                            <caption>Engine & Performance</caption>
                            <tbody>
                                <tr><td className="st-key">Drivetrain</td><td>{car.variants?.[0]?.transmission_type || 'N/A'}</td></tr>
                                <tr><td className="st-key">Displacement</td><td>{car.variants?.[0]?.engine_displacement_cc ? `${car.variants[0].engine_displacement_cc} cc` : 'N/A'}</td></tr>
                                <tr><td className="st-key">Power</td><td>{car.variants?.[0]?.power_output || 'N/A'}</td></tr>
                                <tr><td className="st-key">Torque</td><td>{car.variants?.[0]?.torque || 'N/A'}</td></tr>
                                <tr><td className="st-key">Mileage (ARAI)</td><td>{car.variants?.[0]?.mileage_kmpl ? `${car.variants[0].mileage_kmpl} kmpl` : 'N/A'}</td></tr>
                            </tbody>
                        </table>
                        <table className="spec-table">
                            <caption>Dimensions & Capacity</caption>
                            <tbody>
                                <tr><td className="st-key">Fuel Tank</td><td>{car.fuel_tank_capacity} Litres</td></tr>
                                <tr><td className="st-key">Boot Space</td><td>{car.boot_space_litres} Litres</td></tr>
                                <tr><td className="st-key">Ground Clearance</td><td>{car.ground_clearance_mm} mm</td></tr>
                                <tr><td className="st-key">Seating</td><td>{car.seating_capacity} persons</td></tr>
                                <tr><td className="st-key">Body Type</td><td>{car.body_type}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── Pros & Cons ──────────────────────────────────── */}
                <section className="section" id="pros-cons">
                    <h2 className="section-heading">Pros &amp; Cons</h2>
                    <div className="pros-cons">
                        <div className="pc-column pc-pros">
                            <h3 className="pc-heading">
                                <span className="pc-icon pc-icon-pro">+</span>
                                What&apos;s Good
                            </h3>
                            <ul>
                                {(car.pros || []).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="pc-column pc-cons">
                            <h3 className="pc-heading">
                                <span className="pc-icon pc-icon-con">−</span>
                                What&apos;s Not
                            </h3>
                            <ul>
                                {(car.cons || []).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── Common Problems ──────────────────────────────── */}
                <section className="section" id="problems">
                    <h2 className="section-heading">Common Problems</h2>
                    <p className="section-note">
                        Based on owner reports, service records, and forum discussions.
                        These are known issues — not guaranteed defects.
                    </p>
                    <div className="problems-grid">
                        {(car.commonProblems || []).map((problem, i) => (
                            <div className="problem-card" key={i}>
                                <span className="problem-num">{i + 1}</span>
                                <p>{problem}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Maintenance ──────────────────────────────────── */}
                <section className="section" id="maintenance">
                    <h2 className="section-heading">Maintenance</h2>
                    <div className="maint-grid">
                        <div className="maint-card">
                            <span className="maint-label">Estimated Service Cost</span>
                            <span className="maint-value">{car.maintenanceCostEstimate}</span>
                        </div>
                        <div className="maint-card">
                            <span className="maint-label">Service Interval</span>
                            <span className="maint-value">{car.serviceInterval || 'Every 10,000 km or 12 months'}</span>
                        </div>
                        <div className="maint-card">
                            <span className="maint-label">Warranty</span>
                            <span className="maint-value">2 years / unlimited km (standard)</span>
                        </div>
                    </div>
                </section>

                {/* ── Final Verdict ────────────────────────────────── */}
                <section className="section section-verdict" id="verdict">
                    <h2 className="section-heading">Final Verdict</h2>
                    <div className="verdict-content">
                        <p>{car.verdict || `The ${car.name} is a solid choice in the ${(car.bodyType || '').split(',')[0].trim().toLowerCase()} segment.`}</p>
                        <p className="verdict-note">
                            ★ Research thoroughly. Test drive before buying. Check service network in your city.
                        </p>
                    </div>
                </section>

                {/* ── Customer Reviews ────────────────────────────── */}
                <ReviewsSection carId={car.id} />

                {/* Back */}
                <div className="details-back">
                    <Link to="/cars" className="link-back">← Browse All Cars</Link>
                </div>
            </div>

            {showPitchDeck && (
                <PitchDeckModal
                    carName={car.model_name}
                    specs={pitchSpecs}
                    onClose={() => setShowPitchDeck(false)}
                />
            )}

            {showDriveSim && (
                <DriveSimulator
                    carName={car.model_name}
                    powerBhp={parseInt(car.variants?.[0]?.power_output) || 100}
                    fuelType={car.variants?.[0]?.fuel_type}
                    onClose={() => setShowDriveSim(false)}
                />
            )}
        </div>
    );
}
