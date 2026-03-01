import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

// Global image map — loaded once, shared across all components
let globalImageMap = null;
let fetchPromise = null;
let listeners = [];

// Notify all listening components when the map is loaded
const notifyListeners = () => {
    listeners.forEach(fn => fn({ ...globalImageMap }));
    listeners = [];
};

// Fetch the image map from the server (only once)
const fetchImageMap = () => {
    if (globalImageMap) return Promise.resolve(globalImageMap);
    if (fetchPromise) return fetchPromise;

    fetchPromise = fetch(`${API_BASE_URL}/api/images`)
        .then(res => res.json())
        .then(map => {
            globalImageMap = map;
            notifyListeners();
            return map;
        })
        .catch(err => {
            console.warn('Failed to load image map:', err);
            globalImageMap = {};
            notifyListeners();
            return {};
        });

    return fetchPromise;
};

// Auto-refresh every 30 seconds to pick up newly scraped images
setInterval(() => {
    const oldCount = globalImageMap ? Object.keys(globalImageMap).length : 0;
    fetch(`${API_BASE_URL}/api/images`)
        .then(r => r.json())
        .then(map => {
            const newCount = Object.keys(map).length;
            if (newCount > oldCount) {
                globalImageMap = map;
                // Trigger re-renders for any mounted components
                window.dispatchEvent(new CustomEvent('torquex-images-updated'));
            }
        })
        .catch(() => { /* silent */ });
}, 30000);

/**
 * Hook to get a single car's image from the pre-built image map.
 * The map is fetched ONCE and shared across all components.
 */
export function useCarImage(brand, modelId) {
    const [imageData, setImageData] = useState(() => {
        if (globalImageMap && globalImageMap[modelId]) {
            return { ...globalImageMap[modelId], loading: false };
        }
        return { imageUrl: null, source: null, sourceUrl: null, loading: true };
    });

    useEffect(() => {
        if (!modelId) return;

        // If map already loaded, use it immediately
        if (globalImageMap) {
            const entry = globalImageMap[modelId];
            setImageData({
                imageUrl: entry?.imageUrl || null,
                source: entry?.source || null,
                sourceUrl: entry?.sourceUrl || null,
                loading: false
            });
        } else {
            // Register a listener for when the map loads
            listeners.push((map) => {
                const entry = map[modelId];
                setImageData({
                    imageUrl: entry?.imageUrl || null,
                    source: entry?.source || null,
                    sourceUrl: entry?.sourceUrl || null,
                    loading: false
                });
            });
            fetchImageMap();
        }

        // Listen for background updates (new images scraped)
        const handleUpdate = () => {
            if (globalImageMap && globalImageMap[modelId]) {
                setImageData({
                    ...globalImageMap[modelId],
                    loading: false
                });
            }
        };
        window.addEventListener('torquex-images-updated', handleUpdate);
        return () => window.removeEventListener('torquex-images-updated', handleUpdate);
    }, [modelId]);

    return imageData;
}
