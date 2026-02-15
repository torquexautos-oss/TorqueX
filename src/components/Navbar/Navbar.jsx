import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import './Navbar.css';

export default function Navbar() {
    const { compareList } = useCompare();

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <Link to="/" className="navbar-logo">
                    AutoWheels <span>India</span>
                </Link>
                <div className="navbar-links">
                    <Link to="/">Search</Link>
                    <Link to="/cars">All Cars</Link>
                    <Link to="/compare" className="nav-compare">
                        Compare
                        {compareList.length > 0 && (
                            <span className="nav-compare-badge">{compareList.length}</span>
                        )}
                    </Link>
                </div>
            </div>
        </nav>
    );
}
