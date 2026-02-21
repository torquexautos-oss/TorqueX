import { useState } from 'react';
import { useCarImage } from '../../hooks/useCarImage';
import { Camera } from 'lucide-react';
import './CarImage.css';

const FALLBACK = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"><rect fill="#12121a" width="400" height="250"/><text fill="#333" x="50%" y="50%" text-anchor="middle" dy=".35em" font-size="14" font-family="sans-serif">No Image Available</text></svg>'
);

export default function CarImage({ brand, modelId, name, className = '', showSource = true }) {
    const { imageUrl, source, sourceUrl, loading } = useCarImage(brand, modelId);
    const [imgError, setImgError] = useState(false);

    const displayUrl = (!imgError && imageUrl) ? imageUrl : FALLBACK;
    const isReal = !imgError && !!imageUrl;

    return (
        <div className={`car-image-wrapper ${className}`}>
            {loading && (
                <div className="car-image-skeleton">
                    <div className="skeleton-shimmer" />
                </div>
            )}
            <img
                src={displayUrl}
                alt={name || 'Car image'}
                loading="lazy"
                className={`car-image-img ${loading ? 'car-image-hidden' : ''}`}
                onError={() => setImgError(true)}
                onLoad={() => { }}
            />
            {isReal && showSource && source && (
                <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="car-image-source"
                    title={`Image from ${source}`}
                >
                    <Camera size={9} />
                    {source}
                </a>
            )}
        </div>
    );
}
