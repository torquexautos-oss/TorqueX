import { Router } from 'express';
import { scoreAllCars, getPriceRange } from '../utils/scoringEngine.js';

const router = Router();

router.get('/price-range', (req, res) => {
    try {
        res.json(getPriceRange());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/', (req, res) => {
    try {
        console.log("--- INCOMING API REQUEST ---");
        console.log(req.body);
        
        const {
            performanceWeight = 50, safetyWeight = 50, resaleWeight = 50,
            serviceWeight = 50, mileageWeight = 50, reliabilityWeight = 50,
            minPrice, maxPrice, fuelTypes,
        } = req.body;

        const weightKeys = { performanceWeight, safetyWeight, resaleWeight, serviceWeight, mileageWeight, reliabilityWeight };
        const weights = {};
        for (const [key, val] of Object.entries(weightKeys)) {
            const n = Number(val);
            if (isNaN(n) || n < 0 || n > 100) return res.status(400).json({ error: `${key} must be 0–100` });
            weights[key] = n;
        }

        if (minPrice != null) weights.minPrice = Number(minPrice);
        if (maxPrice != null) weights.maxPrice = Number(maxPrice);
        if (fuelTypes && Array.isArray(fuelTypes) && fuelTypes.length > 0) {
            weights.fuelTypes = fuelTypes;
        }

        const result = scoreAllCars(weights);
        
        if (result.results && result.results.length > 0) {
            console.log("--- SERVING TOP 3 RESULTS ---");
            console.log(result.results.slice(0, 3).map(r => `${r.name} - ${r.price_min}L`));
        }
        
        if (result.error) return res.status(404).json(result);
        res.json(result);
    } catch (e) {
        console.error('[Recommend] Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});
export default router;
