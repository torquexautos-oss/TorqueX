import { Link, useLocation } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { Home, Newspaper, Search, LayoutGrid, Compass, GitCompareArrows } from 'lucide-react';
import './Navbar.css';

const NAV_ITEMS = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/news', label: 'AI News', icon: Newspaper },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/cars', label: 'Catalog', icon: LayoutGrid },
    { to: '/recommend', label: 'Find My Car', icon: Compass },
];

export default function Navbar() {
    const { compareList } = useCompare();
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar-inner container-wide">
                <Link to="/" className="navbar-logo">
                    <span className="logo-torque">TORQUE</span>
                    <span className="logo-x">X</span>
                </Link>

                <div className="navbar-links">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`nav-link ${location.pathname === to ? 'nav-link--active' : ''}`}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </Link>
                    ))}
                    <Link
                        to="/compare"
                        className={`nav-link nav-compare ${location.pathname === '/compare' ? 'nav-link--active' : ''}`}
                    >
                        <GitCompareArrows size={16} />
                        <span>Compare</span>
                        {compareList.length > 0 && (
                            <span className="nav-compare-badge">{compareList.length}</span>
                        )}
                    </Link>
                </div>
            </div>
        </nav>
    );
}
