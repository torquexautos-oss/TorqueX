import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCarById } from '../../services/carService';
import { formatPrice, formatMileage } from '../../utils/formatters';
import ReviewsSection from '../ReviewsSection/ReviewsSection';
import './CarDetailsPage.css';

export default function CarDetailsPage() {
    const { id } = useParams();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);

    useEffect(() => {
        setLoading(true);
        getCarById(id).then((data) => {
            setCar(data);
            setSelectedVariant(null);
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

    return (
        <div className="details-page">
            {/* ── Hero Section ────────────────────────────────────── */}
            <div className="hero">
                <div className="hero-inner container">
                    <div className="hero-image">
                        <img
                            src={car.images[0]}
                            alt={car.name}
                            onError={(e) => {
                                e.target.parentElement.classList.add('hero-image--fallback');
                                e.target.style.display = 'none';
                            }}
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
                            <span className="current">{car.name}</span>
                        </nav>
                        <span className="hero-brand">{car.brand}</span>
                        <h1 className="hero-name">{car.name}</h1>
                        <p className="hero-price">
                            {formatPrice(selectedVariant ? selectedVariant.price : car.price)}
                            <span className="price-suffix">
                                {selectedVariant ? ` — ${selectedVariant.name}` : ' onwards'}
                            </span>
                        </p>
                        {car.priceRange && (
                            <p className="hero-price-range">{car.priceRange}</p>
                        )}

                        {/* ── Variant Selector ──────────────────── */}
                        {car.variants && car.variants.length > 0 && (
                            <div className="variant-selector">
                                <span className="variant-label">Select Variant</span>
                                <div className="variant-list">
                                    {car.variants.map((v, i) => (
                                        <button
                                            key={i}
                                            className={`variant-btn${selectedVariant && selectedVariant.name === v.name ? ' variant-btn--active' : ''}`}
                                            onClick={() => setSelectedVariant(v)}
                                        >
                                            <span className="variant-name">{v.name}</span>
                                            <span className="variant-price">{formatPrice(v.price)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="quick-specs">
                            <div className="qs-item">
                                <span className="qs-value">{formatMileage(car.mileage)}</span>
                                <span className="qs-label">Mileage</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{(car.fuelType || '').split(' / ')[0]}</span>
                                <span className="qs-label">Fuel</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{car.engine}</span>
                                <span className="qs-label">Engine</span>
                            </div>
                            <div className="qs-item">
                                <span className="qs-value">{(car.transmission || '').split(' / ')[0]}</span>
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
                            <span className="ov-value">{car.bodyType}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Fuel Type</span>
                            <span className="ov-value">{car.fuelType}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Transmission</span>
                            <span className="ov-value">{car.transmission}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Seating</span>
                            <span className="ov-value">{car.seatingCapacity} persons</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Emission</span>
                            <span className="ov-value">{car.emissionNorm || 'BS6'}</span>
                        </div>
                        <div className="overview-item">
                            <span className="ov-label">Price Range</span>
                            <span className="ov-value">{car.priceRange || formatPrice(car.price)}</span>
                        </div>
                    </div>
                </section>

                {/* ── Specifications ───────────────────────────────── */}
                <section className="section" id="specifications">
                    <h2 className="section-heading">Specifications</h2>
                    <div className="spec-columns">
                        <table className="spec-table">
                            <caption>Engine & Performance</caption>
                            <tbody>
                                <tr><td className="st-key">Engine</td><td>{car.engineDetails || car.engine}</td></tr>
                                <tr><td className="st-key">Displacement</td><td>{car.engine}</td></tr>
                                <tr><td className="st-key">Power</td><td>{car.power || 'N/A'}</td></tr>
                                <tr><td className="st-key">Torque</td><td>{car.torque || 'N/A'}</td></tr>
                                <tr><td className="st-key">Mileage (ARAI)</td><td>{formatMileage(car.mileage)}</td></tr>
                            </tbody>
                        </table>
                        <table className="spec-table">
                            <caption>Dimensions & Capacity</caption>
                            <tbody>
                                <tr><td className="st-key">Fuel Tank</td><td>{car.fuelTankCapacity}</td></tr>
                                <tr><td className="st-key">Boot Space</td><td>{car.bootSpace}</td></tr>
                                <tr><td className="st-key">Ground Clearance</td><td>{car.groundClearance}</td></tr>
                                <tr><td className="st-key">Seating</td><td>{car.seatingCapacity} persons</td></tr>
                                <tr><td className="st-key">Body Type</td><td>{car.bodyType}</td></tr>
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
        </div>
    );
}
