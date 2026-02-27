import { useState } from 'react';
import { History, Clock } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import './DepreciationSlider.css';

export default function DepreciationSlider({ basePriceLakh, brandName, carImageSrc }) {
    const [yearsOld, setYearsOld] = useState(0);
    const maxYears = 10;

    // Convert to Rs
    const originalPrice = (basePriceLakh || 10) * 100000;

    // Simple Depreciation Logic
    // Toyota/Honda depreciate slowly. Premium Germans depreciate fast.
    const isPremium = ['bmw', 'mercedes-benz', 'audi', 'land rover', 'jaguar', 'porsche'].includes((brandName || '').toLowerCase());
    const isReliable = ['toyota', 'honda', 'maruti suzuki'].includes((brandName || '').toLowerCase());

    const calculateCurrentValue = (years) => {
        let value = originalPrice;
        for (let i = 1; i <= years; i++) {
            let drop = 0.10; // Default 10% per year
            if (i === 1) drop = 0.15; // 15% hit in year 1

            if (isPremium) drop += 0.05; // Germans drop extra 5% a year
            if (isReliable) drop -= 0.03; // Toyotas retain 3% more a year

            value = value * (1 - Math.max(0, drop));
        }
        return Math.max(0, Math.round(value));
    };

    const currentValue = calculateCurrentValue(yearsOld);
    const valueLost = originalPrice - currentValue;
    const valueRetainedPercent = Math.round((currentValue / originalPrice) * 100);

    // Calculate image filter based on age
    // Older = more sepia, slightly less contrast
    const sepiaVal = yearsOld * 8; // Max 80% sepia at 10 years
    const brightnessVal = 100 - (yearsOld * 2); // Drops to 80% brightness
    const imageFilter = `sepia(${sepiaVal}%) brightness(${brightnessVal}%)`;

    return (
        <div className="depreciation-container">
            <div className="dep-header">
                <History className="dep-icon" size={24} />
                <h3>Time-Travel Depreciation</h3>
                <p>See how this car ages and holds its value over {maxYears} years.</p>
            </div>

            <div className="dep-content">
                {/* Visualizer */}
                <div className="dep-visualizer">
                    <div className="dep-image-wrapper">
                        {carImageSrc ? (
                            <img
                                src={carImageSrc}
                                alt={`${brandName} in year ${yearsOld}`}
                                className="dep-img"
                                style={{ filter: imageFilter }}
                            />
                        ) : (
                            <div className="dep-img-placeholder" style={{ filter: imageFilter }}>
                                🚗
                            </div>
                        )}
                        <div className="dep-year-badge">
                            Year {yearsOld}
                            {yearsOld === 0 && ' (New)'}
                        </div>
                    </div>
                </div>

                {/* Controls and Stats */}
                <div className="dep-controls">
                    <div className="dep-stats">
                        <div className="dep-stat-main">
                            <span className="dep-label">Estimated Resale Value</span>
                            <h4 className="dep-val-current">{formatPrice(currentValue)}</h4>
                        </div>
                        <div className="dep-stat-row">
                            <div className="dep-stat-sub">
                                <span className="dep-label-sub">Original Price</span>
                                <span className="dep-val-sub">{formatPrice(originalPrice)}</span>
                            </div>
                            <div className="dep-stat-sub">
                                <span className="dep-label-sub">Value Lost</span>
                                <span className="dep-val-sub loss">-{formatPrice(valueLost)}</span>
                            </div>
                            <div className="dep-stat-sub">
                                <span className="dep-label-sub">Retained</span>
                                <span className="dep-val-sub retain">{valueRetainedPercent}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="dep-slider-wrapper">
                        <div className="slider-labels">
                            <span><Clock size={16} /> Now</span>
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
                        <div className="slider-ticks">
                            {[...Array(maxYears + 1)].map((_, i) => (
                                <span key={i} className={`tick ${yearsOld >= i ? 'active' : ''}`}></span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
