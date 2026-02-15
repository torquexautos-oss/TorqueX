import { formatPrice, formatMileage } from '../../utils/formatters';
import './CompareTable.css';

const ROWS = [
    { label: 'Price', get: (c) => formatPrice(c.price) },
    { label: 'Engine', get: (c) => c.engineDetails || c.engine },
    { label: 'Power', get: (c) => c.power || 'N/A' },
    { label: 'Torque', get: (c) => c.torque || 'N/A' },
    { label: 'Mileage', get: (c) => formatMileage(c.mileage) },
    { label: 'Fuel Type', get: (c) => c.fuelType },
    { label: 'Transmission', get: (c) => c.transmission },
    { label: 'Boot Space', get: (c) => c.bootSpace || 'N/A' },
    { label: 'Ground Clearance', get: (c) => c.groundClearance || 'N/A' },
    { label: 'Seating', get: (c) => `${c.seatingCapacity} persons` },
    { label: 'Body Type', get: (c) => c.bodyType },
    { label: 'Maintenance Cost', get: (c) => c.maintenanceCostEstimate || 'N/A' },
];

export default function CompareTable({ cars, onRemove }) {
    if (cars.length === 0) return null;

    return (
        <div className="compare-table-wrap">
            <table className="compare-table">
                <thead>
                    <tr>
                        <th className="ct-label-col"></th>
                        {cars.map((car) => (
                            <th key={car.id} className="ct-car-col">
                                <div className="ct-car-header">
                                    <img
                                        src={car.images[0]}
                                        alt={car.name}
                                        className="ct-car-img"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <span className="ct-car-brand">{car.brand}</span>
                                    <span className="ct-car-name">{car.name}</span>
                                    <button
                                        className="ct-remove"
                                        onClick={() => onRemove(car.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </th>
                        ))}
                        {cars.length < 2 && (
                            <th className="ct-car-col ct-empty">
                                <div className="ct-car-header ct-placeholder">
                                    <p>Select another car to compare</p>
                                </div>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {ROWS.map((row) => (
                        <tr key={row.label}>
                            <td className="ct-label">{row.label}</td>
                            {cars.map((car) => (
                                <td key={car.id} className="ct-value">{row.get(car)}</td>
                            ))}
                            {cars.length < 2 && <td className="ct-value ct-value--empty">—</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
