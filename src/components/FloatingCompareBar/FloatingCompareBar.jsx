import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import './FloatingCompareBar.css';

const FloatingCompareBar = () => {
    const { compareList } = useCompare();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show the floating bar if we're already on the compare page
    if (compareList.length === 0 || location.pathname === '/compare') return null;

    return (
        <div className="floating-compare-bar">
            <span className="compare-selected-count">{compareList.length} / 3 Cars Selected</span>
            <button className="btn btn-primary compare-action-btn" onClick={() => navigate('/compare')}>
                Compare Now
            </button>
        </div>
    );
};

export default FloatingCompareBar;
