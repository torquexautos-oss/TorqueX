import { Groq } from "groq-sdk";
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Validates if the user's prompt is a genuine car-related query.
 * Prevents "bullshit" prompts from reaching the database scoring.
 */
export async function validateVibePrompt(queryText) {
    const prompt = `
    You are a strict car expert filter.
    Determine if the following user query is a genuine request for a car recommendation or car-related information.
    If it's gibberish, an insult, a random statement, or completely unrelated to cars (e.g., "tell me a joke", "i like pizza"), mark it as INVALID.
    
    User query: "${queryText}"
    
    Return ONLY a JSON object:
    {
      "valid": boolean,
      "reason": "If invalid, a short 1-sentence reason why. If valid, leave empty."
    }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant", // Smaller model is fine for validation
            temperature: 0,
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0]?.message?.content || '{"valid":false}');
    } catch (e) {
        return { valid: true }; // Default to true on API error
    }
}

/**
 * Uses Groq to parse a natural language string into a structured JSON query object
 * for querying the SQLite database.
 */
export async function parseVibeQuery(queryText) {
    const prompt = `
    You are an AI car recommender for the Indian market.
    Convert the user's natural language query into a strict JSON object with these exact keys:
    - budget (number of rupees, parse lakhs to rupees. 1 Lakh = 100,000. If no budget, return 99999999)
    - body_type (string, ONE of: 'SUV', 'Hatchback', 'Sedan', 'MUV', 'Coupe', 'Convertible', 'Minivan', 'Pickup Truck', or 'Any')
    - priority (string, ONE of: 'Performance', 'Mileage', 'Family', 'Status', 'Any')
    - vibe (string, 20 words max describing the user's core lifestyle/need e.g. "rugged offroad", "daily city luxury")

    User query: "${queryText}"
    
    Return ONLY valid JSON. No markdown, no explanations.
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            max_completion_tokens: 150,
            response_format: { type: "json_object" }
        });

        const rawJson = completion.choices[0]?.message?.content || '{}';
        return JSON.parse(rawJson);
    } catch (error) {
        console.error("Groq JSON parsing error:", error);
        return { budget: 99999999, body_type: 'Any', priority: 'Any', vibe: 'Any' };
    }
}

/**
 * Uses Groq to generate a personalized "vibe pitch" for why a specific car matches the user.
 */
export async function generateVibePitch(car, userQuery) {
    const prompt = `
    You are a sophisticated, honest car consultant for the Indian market.
    The user asked: "${userQuery}"
    
    We have selected the ${car.brand} ${car.model_name} as the top match.
    Specs: ${car.body_type} body, approx ₹${car.price_min} Lakh, ${car.fuel} fuel.
    
    Write a 2-3 sentence recommendation. 
    1. Acknowledge their specific need (e.g. city traffic, safety, power).
    2. Explain objectively why this car fits that need based on its specs/nature.
    3. Be enthusiastic but NOT pushy or "salesy". Avoid phrases like "you must buy" or "perfect for you". Use "This matches your need for..." or "The ${car.model_name} excels at...".
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_completion_tokens: 200,
        });

        return completion.choices[0]?.message?.content?.trim() || `The ${car.brand} ${car.model_name} is a fantastic choice!`;
    } catch (error) {
        console.error("Groq pitch generation error:", error);
        return `The ${car.brand} ${car.model_name} is a fantastic choice!`;
    }
}

/**
 * Uses Groq to generate a 3-slide "Sensible" pitch tailored to families.
 */
export async function generatePitchDeck(carName, specs) {
    const prompt = `
    You are an expert sales negotiator. The user wants to buy a ${carName} and needs to convince their family/spouse.
    Ignore extreme performance specs. Focus purely on:
    1. Safety, practicality, and space (Slide 1)
    2. Long-term economics, reliability, and fuel efficiency / low running cost (Slide 2)
    3. Comfort, easy driving, and why the family will love traveling in it (Slide 3)

    Specs for reference: ${JSON.stringify(specs)}

    Return STRICTLY valid JSON like this:
    {
      "slides": [
        {"title": "Safety & Space", "text": "..."},
        {"title": "Smart Economics", "text": "..."},
        {"title": "Unmatched Comfort", "text": "..."}
      ]
    }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_completion_tokens: 400,
            response_format: { type: "json_object" }
        });

        const rawJson = completion.choices[0]?.message?.content || '{}';
        return JSON.parse(rawJson);
    } catch (error) {
        console.error("Groq pitch deck error:", error);
        return {
            slides: [
                { title: "Safe & Practical", text: "Built with high-strength materials and ample space." },
                { title: "Economical", text: "Low running costs make this a sensible long-term choice." },
                { title: "Family Ready", text: "Designed for comfortable weekends with the whole family." }
            ]
        };
    }
}
