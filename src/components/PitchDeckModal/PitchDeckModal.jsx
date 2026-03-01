import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, Shield, PiggyBank, Heart, Sparkles, AlertCircle } from 'lucide-react';
import './PitchDeckModal.css';

// ── Icon mapping — replaces emojis from the AI response ─────────
const SLIDE_ICONS = {
    0: Shield,     // Safety & Space
    1: PiggyBank,  // Smart Economics
    2: Heart,      // Comfort & Family
};

const SLIDE_COLORS = [
    { gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', glow: 'rgba(59,130,246,0.2)' },
    { gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.2)' },
    { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.2)' },
];

export default function PitchDeckModal({ carName, specs, onClose }) {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(false);

        fetch('http://localhost:3002/api/pitch-deck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carName, specs })
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(data => {
                if (data.slides && data.slides.length > 0) {
                    setSlides(data.slides);
                } else {
                    setError(true);
                }
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [carName, specs]);

    const nextSlide = useCallback(() => {
        if (currentIndex < slides.length - 1) setCurrentIndex(prev => prev + 1);
    }, [currentIndex, slides.length]);

    const prevSlide = useCallback(() => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, nextSlide, prevSlide]);

    const slideColor = SLIDE_COLORS[currentIndex] || SLIDE_COLORS[0];
    const SlideIcon = SLIDE_ICONS[currentIndex] || Sparkles;

    return (
        <div className="pitch-overlay" onClick={onClose}>
            <div className="pitch-modal" onClick={e => e.stopPropagation()}>
                <button className="pitch-close" onClick={onClose}><X size={18} /></button>

                {loading ? (
                    <div className="pitch-loading">
                        <div className="pitch-loading-spinner">
                            <Loader2 className="pitch-spin" size={36} />
                        </div>
                        <p className="pitch-loading-title">Crafting your pitch</p>
                        <p className="pitch-loading-sub">Analyzing the {carName} for your family...</p>
                    </div>
                ) : error ? (
                    <div className="pitch-error">
                        <AlertCircle size={40} />
                        <p className="pitch-error-title">Couldn't generate pitch</p>
                        <p className="pitch-error-sub">Make sure the AI backend is running and try again.</p>
                        <button className="pitch-retry-btn" onClick={onClose}>Close</button>
                    </div>
                ) : slides.length > 0 ? (
                    <div className="pitch-content">
                        {/* Progress indicators */}
                        <div className="pitch-indicators">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`pitch-indicator ${idx === currentIndex ? 'active' : (idx < currentIndex ? 'viewed' : '')}`}
                                    onClick={() => setCurrentIndex(idx)}
                                />
                            ))}
                        </div>

                        {/* Slide counter */}
                        <div className="pitch-counter">
                            {currentIndex + 1} / {slides.length}
                        </div>

                        {/* Slide content */}
                        <div className="pitch-slide" key={currentIndex}>
                            <div className="pitch-icon-container" style={{ background: slideColor.gradient, boxShadow: `0 8px 30px ${slideColor.glow}` }}>
                                <SlideIcon size={28} />
                            </div>
                            <h2 className="pitch-title">{slides[currentIndex].title}</h2>
                            <p className="pitch-text">{slides[currentIndex].text}</p>
                        </div>

                        {/* Car name badge */}
                        <div className="pitch-car-badge">
                            <Sparkles size={12} />
                            <span>{carName}</span>
                        </div>

                        {/* Navigation */}
                        <div className="pitch-nav">
                            <button
                                className="pitch-nav-btn"
                                onClick={prevSlide}
                                disabled={currentIndex === 0}
                                aria-label="Previous slide"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                className="pitch-nav-btn"
                                onClick={nextSlide}
                                disabled={currentIndex === slides.length - 1}
                                aria-label="Next slide"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {/* Keyboard hint */}
                        <p className="pitch-hint">Use arrow keys or tap to navigate</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
