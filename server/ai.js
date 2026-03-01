import { Groq } from "groq-sdk";
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Uses Groq to parse a natural language string into a structured JSON query object
 * for querying the SQLite database.
 */
export async function parseVibeQuery(queryText) {
    const prompt = `
    You are an AI car recommender for the Indian market.
    Convert the user's natural language query into a strict JSON object with these exact keys:
    - budget (number of rupees, parse lakhs to rupees. If no budget, return 99999999)
    - body_type (string, ONE of: 'SUV', 'Hatchback', 'Sedan', 'MUV', 'Coupe', 'Convertible', 'Minivan', 'Pickup Truck', or 'Any')
    - priority (string, ONE of: 'Performance', 'Mileage', 'Family', 'Status', 'Any')

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
        return { budget: 99999999, body_type: 'Any', priority: 'Any' };
    }
}

/**
 * Uses Groq to generate a personalized "vibe pitch" for why a specific car matches the user.
 */
export async function generateVibePitch(car, userQuery) {
    const prompt = `
    You are an extremely cool, enthusiastic car expert.
    The user asked: "${userQuery}"
    
    Based on our database, the best matching car is the ${car.brand} ${car.model_name}.
    It has a ${car.body_type} body, costs roughly ₹${car.price_min} Lakh, and fits their vibe.

    Write a short, punchy, magical 2-3 sentence pitch explaining EXACTLY why this car is the perfect "vibe match" for their specific lifestyle request.
    Keep it casual, fun, and highly personalized to their text.
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
