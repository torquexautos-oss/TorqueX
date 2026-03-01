import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { X, BatteryCharging, MountainSnow, Search, Zap } from 'lucide-react';
import CarImage from '../../components/CarImage/CarImage';
import { formatPrice } from '../../utils/formatters';
import { API_BASE_URL } from '../../config';
import './ComparePage.css';

export default function ComparePage() {
    const { compareList, removeFromCompare } = useCompare();
    const [carsData, setCarsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [envType, setEnvType] = useState('garage'); // garage, ev, offroad

    useEffect(() => {
        if (compareList.length === 0) {
            setCarsData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`${API_BASE_URL}/api/db/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: compareList.map(c => c.id) })
        })
            .then(res => res.json())
            .then(data => {
                setCarsData(data.cars || []);

                // Determine epic background environment
                const isEvPresent = data.cars.some(c => c.variants?.[0]?.fuel_type === 'Electric');
                const isSuvPresent = data.cars.some(c => c.body_type?.toLowerCase().includes('suv') && c.ground_clearance_mm >= 200);

                if (isEvPresent) setEnvType('ev');
                else if (isSuvPresent) setEnvType('offroad');
                else setEnvType('garage');

                setLoading(false);
            })
            .catch(err => {
                console.error("Compare fetch error:", err);
                setLoading(false);
            });
    }, [compareList]);

    if (compareList.length === 0) {
        return (
            <div className="compare-empty">
                <h2>Your Virtual Garage is Empty</h2>
                <p>Select up to 3 cars to compare them side-by-side in your garage.</p>
                <Link to="/cars" className="btn btn-primary">Find Cars to Add</Link>
            </div>
        );
    }

    return (
        <div className={`compare-page env-${envType}`}>
            {/* Dynamic Environment Overlay */}
            <div className="env-effects">
                {envType === 'ev' && (
                    <div className="ev-aura">
                        <BatteryCharging className="env-icon" size={200} />
                        <div className="electric-sparks"></div>
                    </div>
                )}
                {envType === 'offroad' && (
                    <div className="offroad-aura">
                        <MountainSnow className="env-icon" size={300} />
                        <div className="mud-splatters"></div>
                    </div>
                )}
                {envType === 'garage' && (
                    <div className="garage-aura">
                        <div className="spotlights"></div>
                    </div>
                )}
            </div>

            <div className="compare-content container">
                <header className="compare-header">
                    <h1>Virtual Garage</h1>
                    <p className="env-status">
                        {envType === 'ev' && <><Zap size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> High-Voltage Charging Bay Active</>}
                        {envType === 'offroad' && <><MountainSnow size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> All-Terrain Analysis Mode</>}
                        {envType === 'garage' && 'Premium Showcase Bay'}
                    </p>
                </header>

                {loading ? (
                    <div className="loading-state">Parking vehicles in your garage...</div>
                ) : (
                    <div className="compare-grid" style={{ gridTemplateColumns: `repeat(${carsData.length}, 1fr)` }}>
                        {carsData.map((car, idx) => {
                            const mainVariant = car.variants?.[0] || {};
                            return (
                                <div key={car.id} className={`compare-vehicle delay-${idx + 1}`}>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeFromCompare(car.id)}
                                        title="Remove from Garage"
                                    >
                                        <X size={20} />
                                    </button>

                                    <div className="vehicle-stage">
                                        <div className="stage-platform"></div>
                                        <CarImage
                                            brand={car.brand}
                                            modelId={car.id}
                                            name={car.model_name}
                                        />
                                    </div>

                                    <div className="vehicle-info">
                                        <h3 className="v-brand">{car.brand}</h3>
                                        <h2 className="v-name">{car.model_name}</h2>
                                        <div className="v-price">
                                            {formatPrice((car.price_min || mainVariant.price_lakh) * 100000)}
                                        </div>
                                    </div>

                                    <div className="vehicle-specs-list">
                                        <div className="v-spec">
                                            <span className="v-spec-label">Body</span>
                                            <span className="v-spec-val">{car.body_type}</span>
                                        </div>
                                        <div className="v-spec">
                                            <span className="v-spec-label">Engine</span>
                                            <span className="v-spec-val">{mainVariant.engine_cc || 'N/A'}{mainVariant.engine_cc ? ' cc' : ''}</span>
                                        </div>
                                        <div className="v-spec">
                                            <span className="v-spec-label">Power</span>
                                            <span className="v-spec-val">{mainVariant.power_bhp} bhp</span>
                                        </div>
                                        <div className="v-spec">
                                            <span className="v-spec-label">Efficiency</span>
                                            <span className="v-spec-val">{mainVariant.mileage_kmpl} kmpl</span>
                                        </div>
                                        <div className="v-spec">
                                            <span className="v-spec-label">Safety</span>
                                            <span className="v-spec-val">{car.ncap_rating} ★</span>
                                        </div>
                                        <div className="v-spec">
                                            <span className="v-spec-label">Ground Clearance</span>
                                            <span className="v-spec-val">{car.ground_clearance_mm} mm</span>
                                        </div>
                                    </div>

                                    <Link to={`/car/${car.id}`} className="v-details-btn">
                                        View Details <Search size={16} />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
