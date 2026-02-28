import { Link } from 'react-router-dom';
import './BrandChannelGrid.css';

// Manual mapping of high-quality, transparent brand logos
const BRAND_LOGOS = {
    'maruti suzuki': '/images/logos/maruti_suzuki.svg',
    'tata': '/images/logos/tata.svg',
    'mahindra': '/images/logos/mahindra.png',
    'hyundai': '/images/logos/hyundai.svg',
    'kia': '/images/logos/kia.svg',
    'toyota': '/images/logos/toyota.svg',
    'honda': '/images/logos/honda.svg',
    'mg motor': '/images/logos/mg_motor.svg',
    'volkswagen': '/images/logos/volkswagen.svg',
    'skoda': '/images/logos/skoda.svg',
    'renault': '/images/logos/renault.svg',
    'nissan': '/images/logos/nissan.svg',
    'jeep': '/images/logos/jeep.svg',
    'citroen': '/images/logos/citroen.svg',
    'mercedes benz': '/images/logos/mercedes_benz.svg',
    'bmw': '/images/logos/bmw.svg',
    'audi': '/images/logos/audi.png',
    'volvo': '/images/logos/volvo.svg',
    'land rover': '/images/logos/land_rover.svg',
    'porsche': '/images/logos/porsche.svg',
    'jaguar': '/images/logos/jaguar.png',
    'tesla': '/images/logos/tesla.svg'
};

const DEFAULT_LOGO = '/images/logos/tata.svg'; // Fallback to a reliable local SVG

// Logos that are naturally black SVG outlines and need to be inverted for the dark theme
const INVERT_LOGOS = ['tata', 'honda', 'nissan', 'jeep', 'volvo', 'renault', 'audi'];

export default function BrandChannelGrid({ brands }) {
    if (!brands || brands.length === 0) {
        return <div className="channel-grid-loading">Loading Channels...</div>;
    }

    return (
        <div className="brand-channels-container">
            <h2 className="channels-title">Browse by Brand</h2>
            <div className="channels-grid">
                {brands.map((brand) => {
                    const brandName = brand.name;
                    const logoUrl = BRAND_LOGOS[brandName.toLowerCase()] || DEFAULT_LOGO;

                    return (
                        <Link
                            key={brand.id}
                            to={`/cars?brand=${encodeURIComponent(brandName)}`}
                            className="channel-card"
                        >
                            <div className="channel-glow"></div>
                            <div className="channel-content">
                                <div className="channel-logo-wrapper">
                                    <img
                                        src={logoUrl}
                                        alt={`${brandName} Logo`}
                                        className={`channel-logo ${logoUrl === DEFAULT_LOGO ? 'fallback-logo' : ''} ${INVERT_LOGOS.includes(brandName.toLowerCase()) ? 'invert-logo' : ''}`}
                                        onError={(e) => { e.target.src = DEFAULT_LOGO; }}
                                    />
                                </div>
                                <div className="channel-info">
                                    <h3 className="channel-name">{brandName}</h3>
                                    <span className="channel-count">{brand.car_count} Models</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
