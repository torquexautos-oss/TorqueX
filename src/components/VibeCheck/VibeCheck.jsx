import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Send, Trophy, Zap, Target, ChevronRight, Brain, TrendingUp, Fuel, Shield, Users, Star, AlertCircle, Car, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import CarImage from '../CarImage/CarImage';
import './VibeCheck.css';

const QUICK_PROMPTS = [
    { label: 'City Commuter', text: 'I need a fuel-efficient car under 10 Lakhs for daily city driving in Bangalore traffic' },
    { label: 'Family Road Trip', text: 'Looking for a spacious SUV under 20 Lakhs with good safety for weekend family road trips' },
    { label: 'EV Convert', text: 'I want to switch to an electric car. Budget around 15-20 Lakhs, good range for city use' },
    { label: 'Performance Beast', text: 'I love fast cars. What\'s the most powerful car I can get under 30 Lakhs?' },
    { label: 'Executive Look', text: 'Need a premium sedan under 25 Lakhs that makes a statement in client meetings' },
    { label: 'Highway Cruiser', text: 'I do 200km highway drives weekly. Need something comfortable with great mileage under 15 Lakhs' },
];

const LOADING_MESSAGES = [
    'Reading your vibe...',
    'Scanning 500+ cars in our garage...',
    'Matching specs to your lifestyle...',
    'Asking our AI car expert...',
    'Almost there, finding your perfect match...',
];

const PRIORITY_ICONS = {
    Performance: Zap,
    Mileage: Fuel,
    Family: Users,
    Status: Star,
    Any: Target,
};

export default function VibeCheck() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loadingMsg, setLoadingMsg] = useState(0);
    const textareaRef = useRef(null);

    // Cycle loading messages
    useEffect(() => {
        if (!loading) return;
        const interval = setInterval(() => {
            setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [loading]);

    const handleVibeCheck = async (text) => {
        const q = text || query;
        if (!q.trim()) return;

        setQuery(q);
        setLoading(true);
        setResult(null);
        setError('');
        setLoadingMsg(0);

        try {
            const res = await fetch('http://localhost:3002/api/vibe-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data);
        } catch (err) {
            setError(err.message || 'Something went wrong. Try again!');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleVibeCheck();
    };

    const formatBudget = (rupees) => {
        if (!rupees || rupees >= 99999999) return 'Any';
        const lakhs = rupees / 100000;
        return lakhs >= 100 ? `₹${(lakhs / 100).toFixed(1)} Cr` : `₹${lakhs.toFixed(0)} Lakh`;
    };

    const PriorityIcon = result?.understoodParams?.priority ? PRIORITY_ICONS[result.understoodParams.priority] || Target : Target;

    return (
        <div className="vibe-check-container">
            <div className="vibe-glow-orb vibe-glow-1" />
            <div className="vibe-glow-orb vibe-glow-2" />

            <div className="vibe-check-header">
                <div className="vibe-badge">
                    <Sparkles size={14} /> AI-Powered
                </div>
                <h2>
                    <Sparkles className="magic-icon" size={22} />
                    Vibe Check
                </h2>
                <p>Tell us your lifestyle, budget, and driving style — our AI finds your perfect car match.</p>
            </div>

            {/* Quick Prompts */}
            {!result && !loading && (
                <div className="vibe-prompts">
                    <span className="vibe-prompts-label">Try a prompt:</span>
                    <div className="vibe-prompts-grid">
                        {QUICK_PROMPTS.map((p, i) => (
                            <button
                                key={i}
                                className="vibe-prompt-chip"
                                onClick={() => handleVibeCheck(p.text)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="vibe-check-form">
                <div className="vibe-input-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="vibe-input"
                        placeholder="Describe your dream car... budget, lifestyle, what matters most to you"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        rows={3}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleVibeCheck();
                            }
                        }}
                    />
                    <button type="submit" className="vibe-send-btn" disabled={loading || !query.trim()}>
                        {loading ? <Loader2 className="spin" size={20} /> : <Send size={18} />}
                    </button>
                </div>
            </form>

            {/* Loading */}
            {loading && (
                <div className="vibe-loading">
                    <div className="vibe-loading-dots">
                        <span /><span /><span />
                    </div>
                    <p className="vibe-loading-text">{LOADING_MESSAGES[loadingMsg]}</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="vibe-error slide-up">
                    <p><AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {error}</p>
                </div>
            )}

            {/* Results */}
            {result && result.matches && (
                <div className="vibe-results slide-up">
                    {/* AI Understanding */}
                    <div className="vibe-understood">
                        <Brain size={16} />
                        <span className="vibe-understood-label">AI understood:</span>
                        <div className="vibe-understood-tags">
                            <span className="vibe-tag">
                                <IndianRupee size={12} /> {formatBudget(result.understoodParams.budget)}
                            </span>
                            <span className="vibe-tag">
                                <Car size={12} /> {result.understoodParams.body_type || 'Any'}
                            </span>
                            <span className="vibe-tag">
                                <PriorityIcon size={12} /> {result.understoodParams.priority || 'Any'}
                            </span>
                        </div>
                    </div>

                    {/* AI Pitch */}
                    <div className="vibe-pitch-box">
                        <div className="vibe-pitch-header">
                            <Sparkles size={16} />
                            <span>AI Recommendation</span>
                        </div>
                        <p className="vibe-pitch-text">{result.pitch}</p>
                    </div>

                    {/* Match Cards */}
                    <div className="vibe-matches">
                        {result.matches.map((car, i) => (
                            <Link
                                to={`/car/${car.id}`}
                                key={car.id}
                                className={`vibe-match-card ${i === 0 ? 'vibe-match-best' : ''}`}
                                style={{ animationDelay: `${i * 0.15}s` }}
                            >
                                <div className="vibe-match-rank">
                                    {i === 0 ? <Trophy size={18} /> : <span>#{i + 1}</span>}
                                </div>

                                <div className="vibe-match-image">
                                    <CarImage brand={car.brand} modelId={car.id} name={car.model_name} showSource={false} />
                                </div>

                                <div className="vibe-match-info">
                                    <span className="vibe-match-brand">{car.brand}</span>
                                    <h4 className="vibe-match-name">{car.model_name}</h4>
                                    <div className="vibe-match-specs">
                                        {car.price_min && (
                                            <span className="vibe-match-price">
                                                ₹{Number(car.price_min).toFixed(1)}L
                                                {car.price_max && car.price_max !== car.price_min && ` – ${Number(car.price_max).toFixed(1)}L`}
                                            </span>
                                        )}
                                        {car.body_type && <span className="vibe-match-type">{car.body_type}</span>}
                                    </div>
                                    <div className="vibe-match-meta">
                                        {car.power_output && <span><Zap size={12} /> {car.power_output}</span>}
                                        {car.mileage_kmpl && <span><Fuel size={12} /> {car.mileage_kmpl} kmpl</span>}
                                        {car.airbags_count && <span><Shield size={12} /> {car.airbags_count} airbags</span>}
                                    </div>
                                </div>

                                <div className="vibe-match-score">
                                    <div className="vibe-score-ring" style={{ '--pct': car.matchPct }}>
                                        <svg viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15.9" className="vibe-ring-bg" />
                                            <circle cx="18" cy="18" r="15.9" className="vibe-ring-fill"
                                                strokeDasharray={`${car.matchPct}, 100`} />
                                        </svg>
                                        <span className="vibe-score-num">{car.matchPct}%</span>
                                    </div>
                                    <span className="vibe-score-label">Match</span>
                                </div>

                                <ChevronRight size={16} className="vibe-match-arrow" />
                            </Link>
                        ))}
                    </div>

                    {/* Try Again */}
                    <button className="vibe-retry-btn" onClick={() => {
                        setResult(null);
                        setQuery('');
                        textareaRef.current?.focus();
                    }}>
                        <Sparkles size={14} /> Try Another Vibe
                    </button>
                </div>
            )}
        </div>
    );
}
