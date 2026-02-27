import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CarCard from '../../components/CarCard/CarCard';
import './RecommendPage.css';

export default function RecommendPage() {
    const [cars, setCars] = useState([]);
    const [step, setStep] = useState(1);
    const [recommendedCars, setRecommendedCars] = useState(null);
    const navigate = useNavigate();

    // Preferences state
    const [budget, setBudget] = useState(1500000); // Default 15 Lakhs
    const [bodyType, setBodyType] = useState('Any');
    const [priority, setPriority] = useState('Mileage'); // Mileage, Performance, Family, Status
    const [fuelType, setFuelType] = useState('Any');

    useEffect(() => {
        fetch('http://localhost:3002/api/db/cars')
            .then(res => res.json())
            .then(data => setCars(data.cars || []));
    }, []);

    const calculateMatches = () => {
        let scoredCars = cars.map(car => {
            let score = 0;
            let maxPossibleScore = 100;

            const carPrice = car.price_min * 100000;

            // 1. Budget checking (Hard constraint to filter out wildly expensive cars)
            if (carPrice > budget * 1.2) {
                // If it's more than 20% over budget, score drops massively
                score -= 50;
            } else if (carPrice <= budget) {
                score += 30; // Within budget is great
            } else {
                score += 10; // Slightly over budget
            }

            // 2. Body Type (Important preference)
            if (bodyType !== 'Any') {
                if (car.body_type && car.body_type.includes(bodyType)) {
                    score += 25;
                } else {
                    maxPossibleScore -= 25; // Don't penalize as heavily, but lower max potential
                }
            }

            // 3. Fuel Type
            if (fuelType !== 'Any') {
                // For DB, we just assume checking variants but cars table doesn't have fuel_type directly.
                // We will just skip harsh penalty or match text.
                // If it's electric we can somewhat guess from name or variants if we fetched them. (Assuming we skip detailed fuel match for now since it's on variants)
            }

            // 4. Priority Logic (Soft matching)
            if (priority === 'Performance') {
                if (carPrice > 2000000) score += 25; // Proxy performance by price segments for now
            } else if (priority === 'Mileage') {
                if (car.body_type === 'Hatchback') score += 20; // Proxy mileage by smaller cars
            } else if (priority === 'Family') {
                if (['SUV', 'MPV'].includes(car.body_type)) score += 20;
                if (car.seating_capacity >= 5) score += 5;
                if (car.seating_capacity >= 7) score += 10;
            } else if (priority === 'Status') {
                if (['Jeep', 'Skoda'].includes(car.brand)) { // Based on DB brands
                    score += 25;
                }
            }

            // Normalize match percentage
            const matchPercentage = Math.max(0, Math.min(100, Math.round((score / maxPossibleScore) * 100)));

            return { ...car, matchPercentage };
        });

        // Sort by highest match, then filter matches > 50%
        scoredCars.sort((a, b) => b.matchPercentage - a.matchPercentage);

        // Take top 6
        setRecommendedCars(scoredCars.slice(0, 6));
        setStep(5);
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    return (
        <main className="recommend-page container">
            <header className="recommend-header">
                <h1>Discovery Queue</h1>
                <p>Let us find the perfect machine for your needs.</p>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
                </div>
            </header>

            <section className="wizard-container">
                {step === 1 && (
                    <div className="wizard-step fade-in">
                        <h2>What's your maximum budget?</h2>
                        <div className="budget-display">{formatCurrency(budget)}</div>
                        <input
                            type="range"
                            min="500000"
                            max="10000000"
                            step="100000"
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className="budget-slider"
                        />
                        <div className="wizard-actions">
                            <button className="btn-primary" onClick={nextStep}>Next step</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="wizard-step fade-in">
                        <h2>Preferred Body Type?</h2>
                        <div className="options-grid">
                            {['Any', 'Hatchback', 'Sedan', 'SUV', 'MPV'].map(type => (
                                <button
                                    key={type}
                                    className={`option-btn ${bodyType === type ? 'active' : ''}`}
                                    onClick={() => setBodyType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <div className="wizard-actions split">
                            <button onClick={prevStep}>Back</button>
                            <button className="btn-primary" onClick={nextStep}>Next step</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="wizard-step fade-in">
                        <h2>Preferred Fuel?</h2>
                        <div className="options-grid">
                            {['Any', 'Petrol', 'Diesel', 'CNG', 'Electric'].map(type => (
                                <button
                                    key={type}
                                    className={`option-btn ${fuelType === type ? 'active' : ''}`}
                                    onClick={() => setFuelType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <div className="wizard-actions split">
                            <button onClick={prevStep}>Back</button>
                            <button className="btn-primary" onClick={nextStep}>Next step</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="wizard-step fade-in">
                        <h2>What matters most to you?</h2>
                        <div className="options-grid priority-grid">
                            {['Mileage', 'Performance', 'Family', 'Status'].map(pri => (
                                <button
                                    key={pri}
                                    className={`option-btn ${priority === pri ? 'active' : ''}`}
                                    onClick={() => setPriority(pri)}
                                >
                                    {pri}
                                </button>
                            ))}
                        </div>
                        <div className="wizard-actions split">
                            <button onClick={prevStep}>Back</button>
                            <button className="btn-primary generate-btn" onClick={calculateMatches}>Discover Matches</button>
                        </div>
                    </div>
                )}

                {step === 5 && recommendedCars && (
                    <div className="wizard-results fade-in">
                        <h2>Your Top Matches</h2>
                        {recommendedCars.length > 0 && recommendedCars[0].matchPercentage > 40 ? (
                            <div className="matches-grid">
                                {recommendedCars.map((car, idx) => (
                                    <div key={car.id} className="match-card-wrapper" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className="match-score">
                                            <span className="score-value">{car.matchPercentage}%</span>
                                            <span className="score-label">Match</span>
                                        </div>
                                        <CarCard car={car} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-matches">
                                <h3>We couldn't find a strong match.</h3>
                                <p>Try adjusting your budget or lowering constraints.</p>
                                <button className="btn-primary" onClick={() => setStep(1)}>Start Over</button>
                            </div>
                        )}
                        {recommendedCars.length > 0 && recommendedCars[0].matchPercentage > 40 && (
                            <div className="results-actions">
                                <button onClick={() => setStep(1)}>Restart Search</button>
                                <button className="btn-primary" onClick={() => navigate('/cars')}>Browse All Cars</button>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}
