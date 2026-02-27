import { useState } from 'react';
import { Sparkles, Loader2, Play } from 'lucide-react';
import CarCard from '../CarCard/CarCard';
import './VibeCheck.css';

export default function VibeCheck() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleVibeCheck = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('http://localhost:3002/api/vibe-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error("Vibe Check failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vibe-check-container">
            <div className="vibe-check-header">
                <Sparkles className="magic-icon" size={24} />
                <h2>AI Vibe Check</h2>
                <p>Describe your lifestyle, budget, and driving style. We'll find your perfect match.</p>
            </div>

            <form onSubmit={handleVibeCheck} className="vibe-check-form">
                <textarea
                    className="vibe-input"
                    placeholder="e.g., I'm a 28-year old techie who hates traffic but loves weekend trips to Lonavala. My budget is around 18 Lakhs..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={3}
                />
                <button type="submit" className="vibe-submit-btn" disabled={loading || !query.trim()}>
                    {loading ? <Loader2 className="spin" size={20} /> : <><Play fill="currentColor" size={16} /> Vibe Check</>}
                </button>
            </form>

            {loading && (
                <div className="vibe-loading">
                    <div className="magical-loader"></div>
                    <p>Analyzing millions of parameters...</p>
                </div>
            )}

            {result && result.car && (
                <div className="vibe-result slide-up">
                    <div className="vibe-pitch-box">
                        <h3>Your Perfect Match ✨</h3>
                        <p className="vibe-pitch-text">"{result.pitch}"</p>
                    </div>
                    <div className="vibe-car-wrapper">
                        <CarCard car={result.car} />
                    </div>
                </div>
            )}
        </div>
    );
}
