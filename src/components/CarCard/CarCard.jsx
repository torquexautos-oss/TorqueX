import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { formatPrice, formatMileage } from '../../utils/formatters';
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

    return (
        <div className="car-card-wrapper">
            <Link to={`/car/${car.id}`} className="car-card">
                <div className="car-card-image">
                    <img
                        src={car.images[0]}
                        alt={car.name}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>

                <div className="car-card-body">
                    <div className="car-card-header">
                        <span className="car-card-brand">{car.brand}</span>
                        <h3 className="car-card-name">{car.name}</h3>
                    </div>

                    <p className="car-card-price">{formatPrice(car.price)}</p>

                    <table className="car-card-specs">
                        <tbody>
                            <tr>
                                <td className="spec-key">Fuel</td>
                                <td className="spec-val">{car.fuelType}</td>
                            </tr>
                            <tr>
                                <td className="spec-key">Mileage</td>
                                <td className="spec-val">{formatMileage(car.mileage)}</td>
                            </tr>
                            <tr>
                                <td className="spec-key">Type</td>
                                <td className="spec-val">{car.bodyType.split(',')[0].trim()}</td>
                            </tr>
                            <tr>
                                <td className="spec-key">Engine</td>
                                <td className="spec-val">{car.engine}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Link>

            <button
                className={`compare-btn ${selected ? 'compare-btn--active' : ''}`}
                onClick={handleCompare}
                disabled={!selected && isFull}
                title={isFull && !selected ? 'Remove a car first (max 2)' : ''}
            >
                {selected ? '✓ Added' : '+ Compare'}
            </button>
        </div>
    );
}
