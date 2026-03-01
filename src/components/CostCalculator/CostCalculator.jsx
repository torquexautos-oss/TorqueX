import { useState, useMemo } from 'react';
import { IndianRupee, Fuel, Wrench, PiggyBank } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import './CostCalculator.css';

export default function CostCalculator({ carPriceLakh, mileageKmpl, fuelType }) {
    // Defaults: 50km/day, 20% down payment
    const [dailyCommute, setDailyCommute] = useState(50);
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [loanTenureYears, setLoanTenureYears] = useState(5);
    const interestRate = 9.5; // Fixed assumption for auto loans

    // Fuel Cost Assumptions
    const fuelPrices = {
        Petrol: 100,
        Diesel: 90,
        CNG: 75,
        Electric: 1.5 // Rs per km roughly
    };
    const currentFuelPrice = fuelPrices[fuelType] || 100;
    const isEV = fuelType?.toLowerCase() === 'electric';

    const calculations = useMemo(() => {
        const carPriceRs = (carPriceLakh || 10) * 100000;

        // 1. EMI Calculation
        const downPaymentRs = carPriceRs * (downPaymentPercent / 100);
        const principal = carPriceRs - downPaymentRs;
        const r = (interestRate / 12) / 100; // monthly interest rate
        const n = loanTenureYears * 12; // months

        const emi = principal > 0
            ? Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
            : 0;

        // 2. Fuel Math
        const monthlyDistance = dailyCommute * 30;
        const monthlyFuelCost = isEV
            ? Math.round(monthlyDistance * currentFuelPrice) // Flat rate per km for EV
            : Math.round((monthlyDistance / (mileageKmpl || 15)) * currentFuelPrice);

        // 3. Maintenance Proxy
        const baseMaintenance = isEV ? 1500 : 3500;
        const monthlyMaintenance = Math.round(baseMaintenance * (carPriceLakh / 10)); // scales slightly with car cost

        const totalMonthly = emi + monthlyFuelCost + monthlyMaintenance;

        return { emi, monthlyFuelCost, monthlyMaintenance, totalMonthly };
    }, [carPriceLakh, dailyCommute, downPaymentPercent, loanTenureYears, mileageKmpl, fuelType, currentFuelPrice, isEV]);

    return (
        <div className="cost-calc" id="cost">
            <div className="cost-header">
                <h3>True Cost of Ownership</h3>
                <p>Calculate your real monthly expenses including EMI, fuel, and upkeep.</p>
            </div>

            <div className="cost-grid">
                {/* Inputs Left */}
                <div className="cost-inputs">
                    <div className="input-group">
                        <label>Daily Commute <span>{dailyCommute} km</span></label>
                        <input
                            type="range" min="5" max="200" step="5"
                            value={dailyCommute} onChange={(e) => setDailyCommute(Number(e.target.value))}
                        />
                    </div>

                    <div className="input-group">
                        <label>Down Payment <span>{downPaymentPercent}%</span></label>
                        <input
                            type="range" min="0" max="100" step="5"
                            value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                        />
                    </div>

                    <div className="input-group">
                        <label>Loan Tenure <span>{loanTenureYears} Years</span></label>
                        <select
                            value={loanTenureYears}
                            onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                            className="cost-select"
                        >
                            <option value={3}>3 Years</option>
                            <option value={5}>5 Years</option>
                            <option value={7}>7 Years</option>
                        </select>
                    </div>
                </div>

                {/* Outputs Right */}
                <div className="cost-outputs">
                    <div className="cost-total-box">
                        <span className="cost-total-label">Estimated Monthly Total</span>
                        <h4 className="cost-total-val">{formatPrice(calculations.totalMonthly)}</h4>
                    </div>

                    <div className="cost-breakdown">
                        <div className="cost-item">
                            <PiggyBank className="c-icon emi-icon" size={20} />
                            <div>
                                <span className="c-label">Car EMI (9.5%)</span>
                                <span className="c-val">{formatPrice(calculations.emi)}</span>
                            </div>
                        </div>
                        <div className="cost-item">
                            <Fuel className="c-icon fuel-icon" size={20} />
                            <div>
                                <span className="c-label">{isEV ? 'Charging Cost' : 'Fuel Cost'}</span>
                                <span className="c-val">{formatPrice(calculations.monthlyFuelCost)}</span>
                            </div>
                        </div>
                        <div className="cost-item">
                            <Wrench className="c-icon maint-icon" size={20} />
                            <div>
                                <span className="c-label">Maintenance / Misc</span>
                                <span className="c-val">{formatPrice(calculations.monthlyMaintenance)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
