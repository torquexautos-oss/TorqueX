/**
 * Car data service — fetches from public/cars_full.json.
 * Provides a cache so the data is fetched only once.
 */

import { groupCarsByModel } from '../utils/carGrouper';

let _cache = null;

export async function fetchAllCars() {
    if (_cache) return _cache;
    const res = await fetch('/cars_full.json');
    _cache = await res.json();
    return _cache;
}

export async function getCarById(id) {
    const cars = await fetchAllCars();
    const grouped = groupCarsByModel(cars);

    const group = grouped.find(g => g.variants.some(v => v.id === id));
    if (group) {
        const specificVariant = group.variants.find(v => v.id === id);
        return {
            ...specificVariant,
            baseModel: group.baseModel,
            variants: group.variants
        };
    }

    return cars.find((car) => car.id === id) || null;
}

export async function getUniqueBrands() {
    const cars = await fetchAllCars();
    return [...new Set(cars.map((car) => car.brand))].sort();
}

export async function getUniqueFuelTypes() {
    const cars = await fetchAllCars();
    const fuelTypes = new Set();
    cars.forEach((car) => {
        (car.fuelType || '').split('/').forEach((ft) => fuelTypes.add(ft.trim()));
    });
    return [...fuelTypes].sort();
}

export async function getUniqueBodyTypes() {
    const cars = await fetchAllCars();
    return [...new Set(cars.map((car) => car.bodyType))].sort();
}
