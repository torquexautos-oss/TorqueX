/**
 * Car data service — fetches from the SQLite database running on the backend.
 */
import { API_BASE_URL } from '../config';

export async function fetchAllCars() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/db/cars`);
        const data = await res.json();
        return data.cars || [];
    } catch (e) {
        console.error("Error fetching all cars:", e);
        return [];
    }
}

export async function getCarById(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/db/cars/${id}`);
        if (!res.ok) return null;
        const car = await res.json();
        return car;
    } catch (e) {
        console.error(`Error fetching car ${id}:`, e);
        return null;
    }
}

export async function searchCars(query) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/db/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data.cars || [];
    } catch (e) {
        console.error(`Error searching cars for "${query}":`, e);
        return [];
    }
}

export async function getUniqueBrands() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/db/brands`);
        const data = await res.json();
        return data.brands.map(b => b.name) || [];
    } catch (e) {
        console.error("Error fetching brands:", e);
        return [];
    }
}

export async function getUniqueFuelTypes() {
    return ['Petrol', 'Diesel', 'CNG', 'EV'];
}

export async function getUniqueBodyTypes() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/db/stats`);
        const data = await res.json();
        return data.bodyTypes || [];
    } catch (e) {
        console.error("Error fetching body types:", e);
        return [];
    }
}
