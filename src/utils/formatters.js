/**
 * Formatting utilities for display values.
 */

export function formatPrice(price) {
    if (price >= 10000000) {
        return `₹ ${(price / 10000000).toFixed(2)} Crore`;
    }
    if (price >= 100000) {
        return `₹ ${(price / 100000).toFixed(2)} Lakh`;
    }
    return `₹ ${price.toLocaleString('en-IN')}`;
}

export function formatMileage(mileage) {
    return `${mileage} km/l`;
}

export function formatPriceForSlider(price) {
    if (price >= 10000000) {
        return `${(price / 10000000).toFixed(1)} Cr`;
    }
    if (price >= 100000) {
        return `${(price / 100000).toFixed(1)} L`;
    }
    return price.toLocaleString('en-IN');
}
