import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const CHASSIS_CODES = [
    'TX-RB26-DETT', 'TX-2JZ-GTE', 'TX-LS-SWAP', 'TX-4G63-T',
    'TX-SR20-DET', 'TX-B18C-5', 'TX-EJ25-STi', 'TX-ROTARY-13B',
    'TX-F136FB', 'TX-V12-LFA', 'TX-S65B40', 'TX-M156-V8', 'TX-911-GT3RS',
    'TX-K20A-TYPE-R', 'TX-S54-M3', 'TX-VOLVO-T5', 'TX-HEMI-MOPAR'
];

function ChassisTracker() {
    const [code, setCode] = React.useState(CHASSIS_CODES[0]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            const next = CHASSIS_CODES[Math.floor(Math.random() * CHASSIS_CODES.length)];
            setCode(next);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="chassis-tracker">
            <span className="chassis-label">CHASSIS_ID:</span>
            <span className="chassis-value">{code}</span>
        </div>
    );
}

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner container">
                <div className="footer-brand">
                    <div className="footer-logo-wrapper">
                        <img src="/logo.png" alt="TorqueX Logo" className="footer-logo-img" />
                        <span className="footer-logo">TORQUEX <span>AUTOS</span></span>
                    </div>
                    <p className="footer-tagline">India's premium automotive intelligence platform. Expert reviews, real-world data, and technical excellence.</p>
                    <div className="footer-system-status">
                        <div className="status-item">
                            <span className="dot pulse-green"></span>
                            CORE_NOMINAL
                        </div>
                        <div className="status-item">
                            <span className="dot pulse-blue"></span>
                            DB_SYNC_ACTIVE
                        </div>
                    </div>
                </div>

                <div className="footer-links-group">
                    <h4>Explore</h4>
                    <Link to="/cars">All Cars</Link>
                    <Link to="/search">Search</Link>
                    <Link to="/recommend">Find My Car</Link>
                    <Link to="/compare">Compare</Link>
                </div>

                <div className="footer-links-group">
                    <h4>Resources</h4>
                    <Link to="/news">Newsfeed</Link>
                    <Link to="/search">Search</Link>
                    <button className="footer-easter-egg-btn" onClick={() => window.scrollTo(0, 0)}>
                        FACTORY_RESET
                    </button>
                </div>
            </div>

            <div className="footer-bottom container">
                <div className="footer-meta">
                    <div className="footer-branding-info">
                        <p>&copy; {new Date().getFullYear()} TorqueX.</p>
                        <p className="footer-signature">Made with ❤️ by Pranav Ahuja (~ Optimus Prime) & Saket Jindal (~ sodiumcyanide)</p>
                    </div>
                    <ChassisTracker />
                </div>
            </div>
        </footer>
    );
}
