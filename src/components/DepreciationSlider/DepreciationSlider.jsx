import { useState, useMemo } from 'react';
import { History, Clock, TrendingDown, ChevronDown, ChevronUp, Calendar, IndianRupee, Car, Award, ShieldCheck, Scale } from 'lucide-react';
import { useCarImage } from '../../hooks/useCarImage';
import { formatPrice } from '../../utils/formatters';
import './DepreciationSlider.css';

// ── Depreciation Model ────────────────────────────────────────────
// Brand tiers affect how much a car depreciates
const BRAND_TIERS = {
    premium: ['bmw', 'mercedes-benz', 'audi', 'land rover', 'jaguar', 'porsche', 'volvo', 'lexus'],
    reliable: ['toyota', 'honda', 'maruti suzuki', 'suzuki'],
    value: ['hyundai', 'kia', 'tata', 'mahindra', 'mg', 'skoda', 'volkswagen'],
};

function getBrandTier(brand) {
    const b = (brand || '').toLowerCase();
    if (BRAND_TIERS.premium.includes(b)) return 'premium';
    if (BRAND_TIERS.reliable.includes(b)) return 'reliable';
    return 'value';
}

// Body type modifiers: SUVs retain value better
function getBodyModifier(bodyType) {
    const bt = (bodyType || '').toLowerCase();
    if (bt.includes('suv') || bt.includes('muv')) return -0.01;   // retains 1% more
    if (bt.includes('sedan')) return 0.01;                         // drops 1% more
    if (bt.includes('coupe') || bt.includes('convertible')) return 0.02;
    return 0;
}

// Fuel type modifiers
function getFuelModifier(fuelType) {
    const ft = (fuelType || '').toLowerCase();
    if (ft === 'electric' || ft === 'ev') return 0.03;  // EVs depreciate faster (battery anxiety)
    if (ft === 'diesel') return 0.01;                    // Diesel slightly faster (stricter rules)
    if (ft === 'cng') return -0.01;                      // CNG holds value in India
    return 0;
}

function calculateDepreciationCurve(originalPrice, brand, bodyType, fuelType, maxYears = 10) {
    const tier = getBrandTier(brand);
    const bodyMod = getBodyModifier(bodyType);
    const fuelMod = getFuelModifier(fuelType);

    // Base rates per year
    const baseRates = {
        premium: [0.20, 0.14, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06, 0.05, 0.05],
        reliable: [0.12, 0.08, 0.07, 0.07, 0.06, 0.06, 0.05, 0.05, 0.04, 0.04],
        value: [0.15, 0.10, 0.09, 0.08, 0.08, 0.07, 0.07, 0.06, 0.06, 0.05],
    };

    const rates = baseRates[tier] || baseRates.value;
    const points = [{ year: 0, value: originalPrice, dropPct: 0, annualDrop: 0, cumLoss: 0 }];
    let value = originalPrice;

    for (let i = 0; i < maxYears; i++) {
        const rate = Math.max(0.02, Math.min(0.30, rates[i] + bodyMod + fuelMod));
        const drop = Math.round(value * rate);
        value = Math.max(0, value - drop);
        const cumLoss = originalPrice - value;
        points.push({
            year: i + 1,
            value,
            dropPct: Math.round(rate * 100),
            annualDrop: drop,
            cumLoss,
        });
    }
    return points;
}

// ── SVG Chart Component ───────────────────────────────────────────
function DepreciationChart({ points, activeYear, originalPrice, onYearClick }) {
    const W = 500, H = 200, PAD_L = 0, PAD_R = 10, PAD_T = 15, PAD_B = 30;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    const maxVal = originalPrice;
    const x = (yr) => PAD_L + (yr / 10) * chartW;
    const y = (val) => PAD_T + chartH - (val / maxVal) * chartH;

    // Build path
    const linePoints = points.map(p => `${x(p.year)},${y(p.value)}`).join(' ');
    const areaPath = `M ${x(0)},${y(points[0].value)} ` +
        points.map(p => `L ${x(p.year)},${y(p.value)}`).join(' ') +
        ` L ${x(10)},${y(0)} L ${x(0)},${y(0)} Z`;

    // Active area (filled up to activeYear)
    const activePoints = points.filter(p => p.year <= activeYear);
    const activeAreaPath = activePoints.length > 1
        ? `M ${x(0)},${y(activePoints[0].value)} ` +
        activePoints.map(p => `L ${x(p.year)},${y(p.value)}`).join(' ') +
        ` L ${x(activeYear)},${y(0)} L ${x(0)},${y(0)} Z`
        : '';

    const activePoint = points[activeYear];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="dep-chart-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(245,158,11,0.25)" />
                    <stop offset="100%" stopColor="rgba(245,158,11,0.02)" />
                </linearGradient>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(245,158,11,0.45)" />
                    <stop offset="100%" stopColor="rgba(245,158,11,0.05)" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(pct => {
                const val = (pct / 100) * maxVal;
                const yPos = y(val);
                return (
                    <g key={pct}>
                        <line x1={PAD_L} y1={yPos} x2={W - PAD_R} y2={yPos}
                            stroke="rgba(255,255,255,0.06)" strokeDasharray="4,4" />
                        {pct > 0 && (
                            <text x={W - PAD_R + 2} y={yPos + 3}
                                fill="var(--text-muted)" fontSize="8" textAnchor="start">
                                {pct}%
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Full area (ghost) */}
            <path d={areaPath} fill="url(#areaGrad)" />

            {/* Active area */}
            {activeAreaPath && (
                <path d={activeAreaPath} fill="url(#activeGrad)" className="dep-chart-active-area" />
            )}

            {/* Line */}
            <polyline points={linePoints} fill="none" stroke="rgba(245,158,11,0.4)"
                strokeWidth="2" strokeLinejoin="round" />

            {/* Active line segment */}
            <polyline
                points={activePoints.map(p => `${x(p.year)},${y(p.value)}`).join(' ')}
                fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"
            />

            {/* Year labels on x-axis */}
            {points.map(p => (
                <g key={p.year} onClick={() => onYearClick(p.year)} style={{ cursor: 'pointer' }}>
                    <text x={x(p.year)} y={H - 8}
                        fill={p.year === activeYear ? '#f59e0b' : 'var(--text-muted)'}
                        fontSize="9" textAnchor="middle"
                        fontWeight={p.year === activeYear ? '700' : '400'}>
                        {p.year === 0 ? 'New' : `${p.year}Y`}
                    </text>
                </g>
            ))}

            {/* Dot markers */}
            {points.map(p => (
                <circle key={p.year} cx={x(p.year)} cy={y(p.value)} r={p.year === activeYear ? 5 : 2.5}
                    fill={p.year <= activeYear ? '#f59e0b' : 'var(--border-strong)'}
                    stroke={p.year === activeYear ? 'var(--text-primary)' : 'none'} strokeWidth="2"
                    onClick={() => onYearClick(p.year)} style={{ cursor: 'pointer' }}
                    filter={p.year === activeYear ? 'url(#glow)' : 'none'}
                />
            ))}

            {/* Active point tooltip */}
            {activePoint && activeYear > 0 && (
                <g>
                    <rect x={x(activeYear) - 40} y={y(activePoint.value) - 28}
                        width="80" height="20" rx="4"
                        fill="rgba(0,0,0,0.75)" stroke="rgba(245,158,11,0.4)" strokeWidth="0.5" />
                    <text x={x(activeYear)} y={y(activePoint.value) - 15}
                        fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="600">
                        {formatPrice(activePoint.value)}
                    </text>
                </g>
            )}
        </svg>
    );
}

// ── Main Component ────────────────────────────────────────────────
export default function DepreciationSlider({ basePriceLakh, brandName, modelId, bodyType, fuelType, carName }) {
    const [yearsOld, setYearsOld] = useState(0);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const maxYears = 10;

    // Use image hook
    const { imageUrl } = useCarImage(brandName, modelId);

    const originalPrice = (basePriceLakh || 10) * 100000;

    // Full depreciation curve
    const curve = useMemo(
        () => calculateDepreciationCurve(originalPrice, brandName, bodyType, fuelType, maxYears),
        [originalPrice, brandName, bodyType, fuelType]
    );

    const current = curve[yearsOld];
    const valueLost = originalPrice - current.value;
    const retainedPct = Math.round((current.value / originalPrice) * 100);

    // Cost per day
    const totalDays = yearsOld * 365;
    const costPerDay = totalDays > 0 ? Math.round(valueLost / totalDays) : 0;
    const monthlyDep = yearsOld > 0 ? Math.round(valueLost / (yearsOld * 12)) : 0;

    // Image aging filter
    const sepiaVal = yearsOld * 8;
    const brightnessVal = 100 - (yearsOld * 3);
    const contrastVal = 100 - (yearsOld * 1.5);
    const imageFilter = `sepia(${sepiaVal}%) brightness(${brightnessVal}%) contrast(${contrastVal}%)`;

    // Tier label
    const tier = getBrandTier(brandName);
    const tierLabel = tier === 'premium' ? 'Premium' : tier === 'reliable' ? 'High Retention' : 'Standard';
    const TierIcon = tier === 'premium' ? Award : tier === 'reliable' ? ShieldCheck : Scale;

    return (
        <section className="dep-section" id="depreciation">
            <div className="dep-header">
                <div className="dep-header-left">
                    <History className="dep-icon" size={22} />
                    <div>
                        <h2 className="dep-title">Time-Travel Depreciation</h2>
                        <p className="dep-subtitle">See how {carName || 'this car'} ages and holds its value</p>
                    </div>
                </div>
                <span className="dep-tier-badge"><TierIcon size={14} /> {tierLabel}</span>
            </div>

            <div className="dep-body">
                {/* Left: Image + Slider */}
                <div className="dep-left">
                    <div className="dep-image-wrapper">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={`${carName || brandName} — year ${yearsOld}`}
                                className="dep-img"
                                style={{ filter: imageFilter }}
                            />
                        ) : (
                            <div className="dep-img-placeholder" style={{ filter: imageFilter }}>
                                <Car size={60} />
                            </div>
                        )}
                        <div className="dep-year-badge">
                            <Calendar size={13} />
                            {yearsOld === 0 ? 'Brand New' : `${yearsOld} Year${yearsOld > 1 ? 's' : ''} Old`}
                        </div>
                        {yearsOld > 0 && (
                            <div className="dep-loss-badge">
                                <TrendingDown size={12} />
                                -{current.dropPct}% this year
                            </div>
                        )}
                    </div>

                    {/* Slider */}
                    <div className="dep-slider-container">
                        <div className="dep-slider-labels">
                            <span><Clock size={14} /> New</span>
                            <span className="dep-slider-year-display">Year {yearsOld}</span>
                            <span>{maxYears} Years</span>
                        </div>
                        <input
                            type="range"
                            className="dep-slider"
                            min="0"
                            max={maxYears}
                            step="1"
                            value={yearsOld}
                            onChange={(e) => setYearsOld(Number(e.target.value))}
                        />
                        <div className="dep-slider-ticks">
                            {[...Array(maxYears + 1)].map((_, i) => (
                                <span key={i}
                                    className={`dep-tick ${yearsOld >= i ? 'active' : ''} ${yearsOld === i ? 'current' : ''}`}
                                    onClick={() => setYearsOld(i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Chart + Stats */}
                <div className="dep-right">
                    {/* Chart */}
                    <div className="dep-chart-container">
                        <DepreciationChart
                            points={curve}
                            activeYear={yearsOld}
                            originalPrice={originalPrice}
                            onYearClick={(yr) => setYearsOld(yr)}
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="dep-stats-grid">
                        <div className="dep-stat-card dep-stat-primary">
                            <span className="dep-stat-label">Resale Value</span>
                            <span className="dep-stat-value accent">{formatPrice(current.value)}</span>
                        </div>
                        <div className="dep-stat-card">
                            <span className="dep-stat-label">Value Lost</span>
                            <span className="dep-stat-value loss">
                                {yearsOld > 0 ? `-${formatPrice(valueLost)}` : '—'}
                            </span>
                        </div>
                        <div className="dep-stat-card">
                            <span className="dep-stat-label">Retained</span>
                            <span className="dep-stat-value retain">{retainedPct}%</span>
                            <div className="dep-retain-bar">
                                <div className="dep-retain-fill" style={{ width: `${retainedPct}%` }} />
                            </div>
                        </div>
                        <div className="dep-stat-card">
                            <span className="dep-stat-label">Cost per Day</span>
                            <span className="dep-stat-value">
                                {costPerDay > 0 ? <><IndianRupee size={14} />{costPerDay.toLocaleString('en-IN')}</> : '—'}
                            </span>
                        </div>
                        <div className="dep-stat-card">
                            <span className="dep-stat-label">Monthly Dep.</span>
                            <span className="dep-stat-value">
                                {monthlyDep > 0 ? formatPrice(monthlyDep) : '—'}
                            </span>
                        </div>
                        <div className="dep-stat-card">
                            <span className="dep-stat-label">Original Price</span>
                            <span className="dep-stat-value muted">{formatPrice(originalPrice)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="dep-breakdown">
                <button className="dep-breakdown-toggle" onClick={() => setShowBreakdown(!showBreakdown)}>
                    {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>Year-by-Year Breakdown</span>
                </button>
                {showBreakdown && (
                    <div className="dep-breakdown-table-wrapper">
                        <table className="dep-breakdown-table">
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Estimated Value</th>
                                    <th>Annual Drop</th>
                                    <th>Drop %</th>
                                    <th>Total Loss</th>
                                </tr>
                            </thead>
                            <tbody>
                                {curve.map((p) => (
                                    <tr key={p.year}
                                        className={`${yearsOld === p.year ? 'active-row' : ''} ${p.year === 0 ? 'new-row' : ''}`}
                                        onClick={() => setYearsOld(p.year)}
                                    >
                                        <td className="year-col">
                                            {p.year === 0 ? 'New' : `Year ${p.year}`}
                                        </td>
                                        <td className="value-col">{formatPrice(p.value)}</td>
                                        <td className="drop-col">
                                            {p.year === 0 ? '—' : `-${formatPrice(p.annualDrop)}`}
                                        </td>
                                        <td className="pct-col">
                                            {p.year === 0 ? '—' : `${p.dropPct}%`}
                                        </td>
                                        <td className="loss-col">
                                            {p.year === 0 ? '—' : `-${formatPrice(p.cumLoss)}`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p className="dep-disclaimer">
                * Estimates based on market averages for {getBrandTier(brandName)} brands. Actual resale value depends on condition, mileage, service history, and market demand.
            </p>
        </section>
    );
}
