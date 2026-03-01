import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { useAuth } from '../../context/AuthContext';
import { Home, Newspaper, LayoutGrid, Compass, GitCompareArrows, BookOpen, User, LogOut } from 'lucide-react';
import './Navbar.css';

const NAV_ITEMS = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/cars', label: 'Catalog', icon: LayoutGrid },
    { to: '/news', label: 'Newsfeed', icon: Newspaper },
    { to: '/search', label: 'Encyclopedia', icon: BookOpen },
    { to: '/recommend', label: 'Find My Car', icon: Compass },
];

export default function Navbar() {
    const { compareList } = useCompare();
    const { currentUser, logout, isSuperUser, openAuthModal } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        setIsMenuOpen(false);
        navigate('/');
    };

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

                    <div className="nav-divider"></div>

                    {currentUser ? (
                        <div className="nav-user-menu" ref={menuRef}>
                            <button
                                className="nav-user-btn"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <div className="nav-avatar">
                                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User size={16} />}
                                </div>
                                <span>{currentUser.displayName || 'User'}</span>
                            </button>

                            {isMenuOpen && (
                                <div className="nav-dropdown">
                                    <div className="nav-dropdown-header">
                                        <strong>{currentUser.displayName || 'User'}</strong>
                                        <span>{currentUser.email}</span>
                                        {isSuperUser && <span className="super-badge">Super Admin</span>}
                                    </div>
                                    <Link to="/profile" className="nav-dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                        <User size={16} />
                                        My Profile
                                    </Link>
                                    <button onClick={handleLogout} className="nav-dropdown-item text-red">
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            className="nav-login-btn"
                            onClick={() => openAuthModal()}
                        >
                            <User size={16} />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
