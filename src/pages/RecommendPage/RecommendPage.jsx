import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './RecommendPage.css';

const FACTORS = [
    { key: 'performanceWeight', label: 'Performance', short: 'PERF', color: '#e24444' },
    { key: 'safetyWeight', label: 'Safety', short: 'SAFE', color: '#3aaf5c' },
    { key: 'resaleWeight', label: 'Resale', short: 'RSAL', color: '#d4a820' },
    { key: 'serviceWeight', label: 'Service', short: 'SRVC', color: '#4a7fd4' },
    { key: 'mileageWeight', label: 'Mileage', short: 'MLGE', color: '#22a892' },
    { key: 'reliabilityWeight', label: 'Reliability', short: 'RLBL', color: '#9060c0' },
];

const FUEL_OPTIONS = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];
const SCORE_KEYS = ['performance', 'safety', 'resale', 'service', 'mileage', 'reliability'];
const SCORE_COLORS = {
    performance: '#e24444', safety: '#3aaf5c', resale: '#d4a820',
    service: '#4a7fd4', mileage: '#22a892', reliability: '#9060c0',
};

// Odometer digit component
function OdoDigit({ value }) {
    const [display, setDisplay] = useState(value);
    const [rolling, setRolling] = useState(false);
    const prev = useRef(value);

    useEffect(() => {
        if (prev.current !== value) {
            setRolling(true);
            const t = setTimeout(() => {
                setDisplay(value);
                setRolling(false);
            }, 80);
            prev.current = value;
            return () => clearTimeout(t);
        }
    }, [value]);

    return (
        <span className={`odo-digit ${rolling ? 'odo-rolling' : ''}`}>
            {display}
        </span>
    );
}

function OdoNumber({ value }) {
    const str = String(value).padStart(2, '0');
    return (
        <span className="odo-number">
            {str.split('').map((d, i) => <OdoDigit key={i} value={d} />)}
        </span>
    );
}

export default function RecommendPage() {
    const [weights, setWeights] = useState({
        performanceWeight: 50, safetyWeight: 50, resaleWeight: 50,
        serviceWeight: 50, mileageWeight: 50, reliabilityWeight: 50,
    });
    const [priceRange, setPriceRange] = useState({ min: 0, max: 200 });
    const [selectedMin, setSelectedMin] = useState(0);
    const [selectedMax, setSelectedMax] = useState(200);
    const [fuelTypes, setFuelTypes] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [firing, setFiring] = useState(false);
    const [ripple, setRipple] = useState(null);
    const [resetFlicker, setResetFlicker] = useState(false);
    const [adjusting, setAdjusting] = useState(false);
    const adjustTimer = useRef(null);

    useEffect(() => {
        fetch('http://localhost:3002/api/recommend/price-range')
            .then(r => r.json())
            .then(data => {
                const uiMax = Math.min(data.max, 200);
                setPriceRange({ min: data.min, max: uiMax, dbMax: data.max });
                setSelectedMin(data.min);
                setSelectedMax(uiMax);
            })
            .catch(() => { });
    }, []);

    const updateWeight = useCallback((key, value) => {
        setWeights(prev => ({ ...prev, [key]: Number(value) }));
        // Trigger torque ripple
        setRipple(key);
        setTimeout(() => setRipple(null), 400);
    }, []);

    const toggleFuel = (fuel) => {
        setFuelTypes(prev =>
            prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
        );
    };

    const handlePriceChange = (setter, val, clamp) => {
        setter(clamp(Number(val)));
        setAdjusting(true);
        clearTimeout(adjustTimer.current);
        adjustTimer.current = setTimeout(() => setAdjusting(false), 800);
    };

    const badges = useMemo(() => {
        const b = [];
        if (weights.safetyWeight > 60) b.push('Safety First');
        if (weights.performanceWeight > 60) b.push('Driving Enthusiast');
        if (weights.mileageWeight > 60) b.push('Efficiency Mode');
        if (weights.reliabilityWeight > 60) b.push('Long-Term Owner');
        if (weights.resaleWeight > 60) b.push('Smart Investor');
        if (weights.serviceWeight > 60) b.push('Peace of Mind');
        return b;
    }, [weights]);

    const profileTop2 = useMemo(() => {
        const sorted = FACTORS.map(f => ({ label: f.label, val: weights[f.key] }))
            .sort((a, b) => b.val - a.val);
        const top = sorted.filter(s => s.val > 0).slice(0, 2);
        if (!top.length) return null;
        return top.map(t => t.label).join(' & ');
    }, [weights]);

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const allSet = Object.values(weights).every(v => v > 0);

    const generate = async () => {
        setFiring(true);
        setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const body = {
                    ...weights,
                    minPrice: selectedMin,
                    maxPrice: selectedMax >= priceRange.max ? (priceRange.dbMax || priceRange.max) : selectedMax,
                };
                if (fuelTypes.length > 0) body.fuelTypes = fuelTypes;
                const res = await fetch('http://localhost:3002/api/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const data = await res.json();
                if (!res.ok || data.error) {
                    setError(data.error || `Server error: ${res.status}`);
                    setResults(null);
                } else if (data.message) {
                    setError(data.message);
                    setResults(null);
                } else {
                    setResults(data.results);
                }
            } catch (e) {
                setError(e.message || 'Failed to fetch');
                setResults(null);
            } finally {
                setLoading(false);
                setFiring(false);
            }
        }, 350);
    };

    const reset = () => {
        setResetFlicker(true);
        setTimeout(() => setResetFlicker(false), 500);
        setWeights({
            performanceWeight: 50, safetyWeight: 50, resaleWeight: 50,
            serviceWeight: 50, mileageWeight: 50, reliabilityWeight: 50,
        });
        setSelectedMin(priceRange.min);
        setSelectedMax(priceRange.max);
        setFuelTypes([]);
        setResults(null);
        setError(null);
    };

    const formatPrice = (price) => {
        if (!price && price !== 0) return 'N/A';
        if (price >= 100) return `₹${(price / 100).toFixed(2)} Cr`;
        return `₹${price.toFixed(2)} L`;
    };

    const fmtHud = (v) => v >= 100 ? `₹${(v / 100).toFixed(0)}Cr` : `₹${v}L`;

    return (
        <main className="mach-page">
            <div className="mach-container">

                <header className="mach-header">
                    <h1>Intelligent Car Advisor</h1>
                    <p className="mach-sub">Configure your priorities. Our engine scores 574 cars across 6 dimensions.</p>
                </header>

                {/* ── HUD Profile ─────────────────────────── */}
                <div className="hud-profile">
                    {profileTop2 && (
                        <span className="hud-tag">[ {profileTop2} ]</span>
                    )}
                    {badges.length > 0 && (
                        <div className="hud-badges">
                            {badges.map(b => <span key={b} className="hud-badge">{b}</span>)}
                        </div>
                    )}
                </div>

                {/* ═══ ENGINE BLOCK ═══════════════════════ */}
                <section className="engine-block">
                    <div className="section-rule">
                        <span className="section-label">ENGINE CONFIGURATOR</span>
                    </div>

                    <div className="pistons-row">
                        {FACTORS.map(f => {
                            const val = weights[f.key];
                            const pct = totalWeight > 0 ? Math.round((val / totalWeight) * 100) : 0;
                            const isHot = val > 70;
                            const isRippling = ripple === f.key;
                            return (
                                <div key={f.key} className={`piston-col ${isHot ? 'piston-hot' : ''}`}
                                    style={{ '--pc': f.color }}>

                                    {/* Odometer value */}
                                    <div className="piston-odo" style={{ color: f.color }}>
                                        <OdoNumber value={val} />
                                    </div>

                                    {/* ECU readout */}
                                    <div className="piston-ecu">{pct}%</div>

                                    {/* Cylinder */}
                                    <div className="cyl">
                                        <div className="cyl-bore">
                                            <div className="cyl-tick" style={{ bottom: '25%' }} />
                                            <div className="cyl-tick" style={{ bottom: '50%' }} />
                                            <div className="cyl-tick" style={{ bottom: '75%' }} />

                                            {/* Combustion glow */}
                                            <div className={`combustion ${isHot ? 'combustion-pulse' : ''}`}
                                                style={{
                                                    opacity: val / 130,
                                                    background: `radial-gradient(ellipse at center top, ${f.color}55 0%, transparent 70%)`
                                                }} />

                                            {/* Piston head */}
                                            <div className="piston-head" style={{
                                                bottom: `calc(${val}% - 9px)`,
                                                boxShadow: isHot
                                                    ? `0 0 14px ${f.color}40, 0 -2px 4px ${f.color}30, inset 0 -3px 6px rgba(0,0,0,0.6)`
                                                    : 'inset 0 -3px 6px rgba(0,0,0,0.6)',
                                            }}>
                                                <div className="p-ring" />
                                                <div className="p-ring" />
                                                <div className="p-ring" />
                                            </div>

                                            {/* Pressure fill */}
                                            <div className="piston-fill" style={{
                                                height: `${val}%`,
                                                background: `linear-gradient(to top, ${f.color}20 0%, ${f.color}06 100%)`,
                                            }} />
                                        </div>

                                        <input type="range" min="0" max="100" step="1" value={val}
                                            onChange={e => updateWeight(f.key, e.target.value)}
                                            className="cyl-input" />
                                    </div>

                                    {/* Connecting rod */}
                                    <div className="conrod">
                                        <div className="conrod-shaft" />
                                        <div className="conrod-pin" />
                                    </div>

                                    {/* Torque ripple */}
                                    <div className={`torque-ripple ${isRippling ? 'ripple-active' : ''}`}
                                        style={{ borderColor: f.color }} />

                                    {/* Stamped label */}
                                    <div className="stamp-label">{f.short}</div>
                                    <div className="stamp-sub">{f.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ═══ FILTERS ═══════════════════════════ */}
                <div className="filters-row">
                    {/* Fuel */}
                    <div className="filter-panel">
                        <div className="section-rule sm">
                            <span className="section-label">FUEL TYPE</span>
                        </div>
                        <div className="led-pills">
                            {FUEL_OPTIONS.map(fuel => (
                                <button key={fuel}
                                    className={`led-pill ${fuelTypes.includes(fuel) ? 'led-on' : ''}`}
                                    onClick={() => toggleFuel(fuel)}>
                                    <span className="led-dot" />
                                    {fuel}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget — Boost Gauge */}
                    <div className={`filter-panel boost-panel ${adjusting ? 'boost-active' : ''}`}>
                        <div className="section-rule sm">
                            <span className="section-label">BUDGET RANGE</span>
                        </div>
                        <div className="boost-hud">
                            <span className="boost-val">{fmtHud(selectedMin)}</span>
                            <span className="boost-sep">⟶</span>
                            <span className="boost-val">{selectedMax >= priceRange.max ? `${fmtHud(selectedMax)}+` : fmtHud(selectedMax)}</span>
                        </div>
                        <div className="boost-gauge">
                            <div className="boost-track">
                                <div className="boost-fill" style={{
                                    left: `${((selectedMin - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                                    right: `${100 - ((selectedMax - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                                }} />
                                {/* Tick marks */}
                                {[5, 10, 20, 50, 100, 200].filter(v => v <= priceRange.max).map(v => (
                                    <div key={v} className="boost-tick"
                                        style={{ left: `${((v - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%` }}>
                                        <div className="boost-tick-line" />
                                        <span className="boost-tick-label">{v >= 100 ? `₹${v / 100}Cr` : `₹${v}L`}</span>
                                    </div>
                                ))}
                            </div>
                            <input type="range" min={priceRange.min} max={priceRange.max} step="1"
                                value={selectedMin}
                                onChange={e => handlePriceChange(setSelectedMin, e.target.value, v => Math.min(v, selectedMax - 1))}
                                className="boost-input" />
                            <input type="range" min={priceRange.min} max={priceRange.max} step="1"
                                value={selectedMax}
                                onChange={e => handlePriceChange(setSelectedMax, e.target.value, v => Math.max(v, selectedMin + 1))}
                                className="boost-input" />
                        </div>
                    </div>
                </div>

                {/* ═══ ACTIONS ═══════════════════════════ */}
                <div className="action-row">
                    {allSet && <span className="engine-ready">ENGINE READY</span>}
                    <button className={`ignition-btn ${firing ? 'ignition-fire' : ''}`}
                        onClick={generate} disabled={loading || firing}>
                        {loading ? 'ANALYZING...' : 'IGNITE'}
                    </button>
                    <button className={`ecu-reset ${resetFlicker ? 'ecu-flicker' : ''}`}
                        onClick={reset} disabled={loading}>
                        ECU RESET
                    </button>
                </div>

                {/* Error */}
                {error && <div className="mach-error"><p>{error}</p></div>}

                {/* ═══ RESULTS ═══════════════════════════ */}
                {results && results.length > 0 && (
                    <section className="mach-results">
                        <div className="section-rule">
                            <span className="section-label">TOP 10 RANKED</span>
                        </div>
                        <div className="results-list">
                            {results.map((car, idx) => (
                                <Link to={`/car/${car.id}`} key={car.id} className="res-card">
                                    <div className="res-rank">
                                        <span>{idx + 1}</span>
                                    </div>
                                    <div className="res-body">
                                        <div className="res-top">
                                            <div>
                                                <span className="res-brand">{car.brand}</span>
                                                <h3 className="res-name">{car.name}</h3>
                                                <div className="res-tags">
                                                    <span>{formatPrice(car.price_min)}</span>
                                                    {car.fuel !== 'N/A' && <span>{car.fuel}</span>}
                                                    {car.bodyType && <span>{car.bodyType}</span>}
                                                </div>
                                            </div>
                                            <div className="res-score">
                                                <span className="res-score-big">{car.finalScore.toFixed(1)}</span>
                                                <span className="res-score-sub">/10</span>
                                            </div>
                                        </div>
                                        <div className="res-bars">
                                            {SCORE_KEYS.map(k => (
                                                <div key={k} className="res-bar">
                                                    <span className="res-bar-k">{k.slice(0, 4).toUpperCase()}</span>
                                                    <div className="res-bar-track">
                                                        <div className="res-bar-fill" style={{
                                                            width: `${(car.scoreBreakdown[k] / 10) * 100}%`,
                                                            backgroundColor: SCORE_COLORS[k],
                                                        }} />
                                                    </div>
                                                    <span className="res-bar-v">{car.scoreBreakdown[k].toFixed(1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="action-row" style={{ marginTop: '2rem' }}>
                            <button className="ignition-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                RE-CONFIGURE
                            </button>
                            <Link to="/cars" className="ecu-reset">BROWSE ALL</Link>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
