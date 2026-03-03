import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner container-wide">
                <div className="footer-brand">
                    <span className="footer-logo">TORQUE<span>X</span></span>
                    <p className="footer-tagline">India's premium automotive intelligence platform. Real specs, honest reviews, AI-powered insights.</p>
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
                    <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                </div>
            </div>

            <div className="footer-bottom container-wide">
                <p>&copy; {new Date().getFullYear()} TorqueX. Made with ❤️ by Pranav Ahuja (~Optimus Prime) & Saket Jindal (~sodiumcyanide)</p>
            </div>
        </footer>
    );
}
