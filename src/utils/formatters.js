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
    if (!mileage || mileage === '0' || mileage === 0 || mileage === 'N/A') {
        return 'N/A';
    }
    const num = parseFloat(mileage);
    if (isNaN(num) || num === 0) return 'N/A';
    return `${num} km/l`;
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
