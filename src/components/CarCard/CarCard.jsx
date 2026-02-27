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
                        modelId={car.id}
                        name={car.model_name}
                    />
                </div>

                <div className="car-card-body">
                    <span className="car-card-brand">{car.brand}</span>
                    <h3 className="car-card-name">{car.model_name}</h3>

                    {/* Price range display */}
                    <div className="car-card-price-range">
                        <span className="car-card-price">{formatPrice(car.price_min * 100000)}</span>
                        {car.price_max && car.price_max > car.price_min && (
                            <>
                                <span className="car-card-price-sep">—</span>
                                <span className="car-card-price-high">{formatPrice(car.price_max * 100000)}</span>
                            </>
                        )}
                    </div>

                    <div className="car-card-specs">
                        <div className="spec-item">
                            <Fuel size={13} />
                            <span>{car.body_type}</span>
                        </div>
                        <div className="spec-item">
                            <Gauge size={13} />
                            <span>NCAP: {car.ncap_rating || car.bncap_rating || 'N/A'}★</span>
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
