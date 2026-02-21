import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { formatPrice, formatMileage } from '../../utils/formatters';
import CarImage from '../CarImage/CarImage';
import { Fuel, Gauge, Settings2, Check, Plus, Layers } from 'lucide-react';
import './CarCard.css';

export default function CarCard({ car }) {
    const { addToCompare, removeFromCompare, isInCompare, compareList } = useCompare();
    const selected = isInCompare(car.id);
    const isFull = compareList.length >= 2;

    const handleCompare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selected) {
            removeFromCompare(car.id);
        } else {
            addToCompare(car);
        }
    };

    const hasVariants = car.variantCount && car.variantCount > 1;
    const displayEngine = car.engine && car.engine !== 'N/A'
        ? car.engine
        : (car.fuelType?.toLowerCase().includes('electric') ? 'Electric' : 'N/A');

    return (
        <div className="car-card-wrapper card">
            <Link to={`/car/${car.id}`} className="car-card">
                <div className="car-card-image">
                    <CarImage
                        brand={car.brand}
                        modelId={car.representative?.id || car.id}
                        name={car.baseModel || car.name}
                    />
                    {hasVariants && (
                        <span className="car-card-variants-badge">
                            <Layers size={11} />
                            {car.variantCount} variants
                        </span>
                    )}
                </div>

                <div className="car-card-body">
                    <span className="car-card-brand">{car.brand}</span>
                    <h3 className="car-card-name">{car.baseModel || car.name}</h3>

                    {/* Price: range for multi-variant, single for standalone */}
                    {hasVariants ? (
                        <div className="car-card-price-range">
                            <span className="car-card-price">{formatPrice(car.priceMin)}</span>
                            <span className="car-card-price-sep">—</span>
                            <span className="car-card-price-high">{formatPrice(car.priceMax)}</span>
                        </div>
                    ) : (
                        <p className="car-card-price">{formatPrice(car.price)}</p>
                    )}

                    <div className="car-card-specs">
                        <div className="spec-item">
                            <Fuel size={13} />
                            <span>{car.fuelType}</span>
                        </div>
                        <div className="spec-item">
                            <Gauge size={13} />
                            <span>{formatMileage(car.mileage)}</span>
                        </div>
                        <div className="spec-item">
                            <Settings2 size={13} />
                            <span>{displayEngine}</span>
                        </div>
                    </div>
                </div>
            </Link>

            <button
                className={`compare-btn ${selected ? 'compare-btn--active' : ''}`}
                onClick={handleCompare}
                disabled={!selected && isFull}
                title={isFull && !selected ? 'Remove a car first (max 2)' : ''}
            >
                {selected ? <><Check size={14} /> Added</> : <><Plus size={14} /> Compare</>}
            </button>
        </div>
    );
}
