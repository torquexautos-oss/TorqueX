import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import './PitchDeckModal.css';

export default function PitchDeckModal({ carName, specs, onClose }) {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Fetch the AI-generated pitch deck slides
        fetch('http://localhost:3002/api/pitch-deck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carName, specs })
        })
            .then(res => res.json())
            .then(data => {
                if (data.slides && data.slides.length > 0) {
                    setSlides(data.slides);
                }
            })
            .catch(err => console.error("Pitch Deck Error:", err))
            .finally(() => setLoading(false));
    }, [carName, specs]);

    const nextSlide = () => {
        if (currentIndex < slides.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevSlide = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    return (
        <div className="pitch-overlay" onClick={onClose}>
            <div className="pitch-modal" onClick={e => e.stopPropagation()}>
                <button className="pitch-close" onClick={onClose}><X size={24} /></button>

                {loading ? (
                    <div className="pitch-loading">
                        <Loader2 className="spin" size={40} />
                        <p>Generating the perfect pitch...</p>
                    </div>
                ) : slides.length > 0 ? (
                    <div className="pitch-content">
                        {/* Slide Indicators like IG Stories */}
                        <div className="pitch-indicators">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`pitch-indicator ${idx === currentIndex ? 'active' : (idx < currentIndex ? 'viewed' : '')}`}
                                />
                            ))}
                        </div>

                        <div className="pitch-slide fade-in" key={currentIndex}>
                            <div className="pitch-emoji">{slides[currentIndex].emoji}</div>
                            <h2 className="pitch-title">{slides[currentIndex].title}</h2>
                            <p className="pitch-text">{slides[currentIndex].text}</p>
                        </div>

                        {/* Navigation Arrows */}
                        <div className="pitch-nav">
                            <button
                                className="pitch-nav-btn"
                                onClick={prevSlide}
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeft size={30} />
                            </button>
                            <button
                                className="pitch-nav-btn"
                                onClick={nextSlide}
                                disabled={currentIndex === slides.length - 1}
                            >
                                <ChevronRight size={30} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="pitch-error">
                        <p>Failed to generate pitch. The AI might be taking a coffee break.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
