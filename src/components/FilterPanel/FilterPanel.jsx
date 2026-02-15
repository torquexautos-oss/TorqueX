import { getUniqueBrands, getUniqueFuelTypes } from '../../services/carService';
import './FilterPanel.css';

export default function FilterPanel({
    selectedBrand,
    onBrandChange,
    selectedFuel,
    onFuelChange,
    maxPrice,
    onMaxPriceChange,
    priceRange,
    resultCount,
    onReset,
}) {
    const brands = getUniqueBrands();
    const fuelTypes = getUniqueFuelTypes();
    const hasFilters = selectedBrand || selectedFuel || maxPrice < priceRange.max;

    return (
        <div className="filter-panel">
            <div className="filter-row">
                <div className="filter-group">
                    <label htmlFor="brand-filter">Brand</label>
                    <select
                        id="brand-filter"
                        value={selectedBrand}
                        onChange={(e) => onBrandChange(e.target.value)}
                    >
                        <option value="">All Brands</option>
                        {brands.map((b) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="fuel-filter">Fuel Type</label>
                    <select
                        id="fuel-filter"
                        value={selectedFuel}
                        onChange={(e) => onFuelChange(e.target.value)}
                    >
                        <option value="">All Fuel Types</option>
                        {fuelTypes.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="price-filter">
                        Max Price: ₹ {maxPrice >= 10000000
                            ? (maxPrice / 10000000).toFixed(1) + ' Cr'
                            : (maxPrice / 100000).toFixed(1) + ' L'}
                    </label>
                    <input
                        id="price-filter"
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={maxPrice}
                        onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                    />
                </div>

                {hasFilters && (
                    <button className="filter-reset" onClick={onReset}>
                        Reset
                    </button>
                )}
            </div>

            <p className="filter-count">{resultCount} cars found</p>
        </div>
    );
}
