import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Fuel, Activity, ChevronRight, Trophy, TrendingUp, BatteryCharging } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function CatalogHighlights() {
    const [highlights, setHighlights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('power');

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/db/highlights`)
            .then(res => res.json())
            .then(data => {
                setHighlights(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="highlights-loader">Initializing Engine Metrics...</div>;
    if (!highlights) return null;

    const dataMap = {
        power: {
            title: 'HORSEPOWER_KINGS',
            icon: Zap,
            cars: highlights.topPower,
            color: 'var(--accent-primary)',
            label: 'BHP'
        },
        mileage: {
            title: 'EFFICIENCY_MASTERS',
            icon: Fuel,
            cars: highlights.topMileage,
            color: '#10b981',
            label: 'km/l'
        },
        evs: {
            title: 'ELECTRIC_ELITE',
            icon: BatteryCharging,
            cars: highlights.topEVs,
            color: '#34d399',
            label: 'Premium'
        }
    };

    const current = dataMap[activeTab];

    return (
        <div className="catalog-highlights">
            <div className="highlights-tabs">
                {Object.keys(dataMap).map(tab => (
                    <button
                        key={tab}
                        className={`highlight-tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="highlights-content slide-up">
                <div className="highlight-header">
                    <current.icon size={16} />
                    <span>{current.title}</span>
                </div>

                <div className="highlight-list">
                    {current.cars.map((car, i) => (
                        <Link to={`/car/${car.id}`} key={car.id} className="highlight-item">
                            <div className="item-rank">0{i + 1}</div>
                            <div className="item-info">
                                <span className="item-brand">{car.brand}</span>
                                <span className="item-name">{car.modelName}</span>
                            </div>
                            <div className="item-stat" style={{ color: current.color }}>
                                {activeTab === 'power' ? car.power : (activeTab === 'mileage' ? car.mileage?.split(' ')[0] : 'EV')}
                                <small>{current.label}</small>
                            </div>
                            <ChevronRight size={14} className="item-arrow" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
