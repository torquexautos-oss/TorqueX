import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Home, Newspaper, LayoutGrid, Compass, GitCompareArrows, BookOpen, User, LogOut, Menu, X, Layers, Sun, Moon } from 'lucide-react';
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
    const { isBlueprintMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false); // For user dropdown
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // For hamburger
    const menuRef = useRef(null);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    // Close menus on route change
    useEffect(() => {
        window.queueMicrotask(() => {
            setIsMobileMenuOpen(prev => prev ? false : prev);
            setIsMenuOpen(prev => prev ? false : prev);
        });
    }, [location.pathname]);

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
                    <img src="/logo.png" alt="TorqueX Logo" className="logo-img" />
                    <span className="logo-torque">TORQUEX</span>
                    <span className="logo-x">AUTOS</span>
                </Link>

                <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    {NAV_ITEMS.map(({ to, label, icon: _Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`nav-link ${location.pathname === to ? 'nav-link--active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <_Icon size={18} />
                            <span>{label}</span>
                        </Link>
                    ))}
                    <Link
                        to="/compare"
                        className={`nav-link nav-compare ${location.pathname === '/compare' ? 'nav-link--active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <GitCompareArrows size={18} />
                        <span>Compare</span>
                        {compareList.length > 0 && (
                            <span className="nav-compare-badge">{compareList.length}</span>
                        )}
                    </Link>

                    <div className="nav-divider"></div>

                    <button
                        className={`nav-theme-toggle ${isBlueprintMode ? 'light' : 'dark'}`}
                        onClick={toggleTheme}
                        title={isBlueprintMode ? "Enter Stealth Mode (Dark)" : "View Engineering Blueprint (Light)"}
                    >
                        <div className="toggle-track">
                            <div className="toggle-thumb">
                                {isBlueprintMode ? <Sun size={12} strokeWidth={3} /> : <Moon size={12} strokeWidth={3} />}
                            </div>
                        </div>
                        <div className="theme-labels">
                            <span className={`label-item ${!isBlueprintMode ? 'active' : ''}`}>STEALTH</span>
                            <span className="label-sep">/</span>
                            <span className={`label-item ${isBlueprintMode ? 'active' : ''}`}>BLUEPRINT</span>
                        </div>
                    </button>

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
                            onClick={() => { openAuthModal(); setIsMobileMenuOpen(false); }}
                        >
                            <User size={18} />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
}
