import { useState, useEffect, useMemo } from 'react';
import ReviewCard from '../../components/ReviewCard/ReviewCard';
import ReviewForm from '../../components/ReviewForm/ReviewForm';
import reviewsData from '../../data/reviews.json';
import './ReviewsSection.css';

export default function ReviewsSection({ carId }) {
    // Seed from JSON, augmented with local reviews
    const [localReviews, setLocalReviews] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

    // Combine JSON reviews + local reviews for this car
    const allReviews = useMemo(() => {
        const fromFile = reviewsData.filter((r) => r.carId === carId);
        const fromLocal = localReviews.filter((r) => r.carId === carId);
        return [...fromLocal, ...fromFile];
    }, [carId, localReviews]);

    // Sort
    const sortedReviews = useMemo(() => {
        const copy = [...allReviews];
        if (sortBy === 'newest') copy.sort((a, b) => new Date(b.date) - new Date(a.date));
        else if (sortBy === 'oldest') copy.sort((a, b) => new Date(a.date) - new Date(b.date));
        else if (sortBy === 'highest') copy.sort((a, b) => b.rating - a.rating);
        else if (sortBy === 'lowest') copy.sort((a, b) => a.rating - b.rating);
        return copy;
    }, [allReviews, sortBy]);

    // Stats
    const avgRating =
        allReviews.length > 0
            ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
            : '0.0';

    const ratingBreakdown = useMemo(() => {
        const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star
        allReviews.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
        });
        return counts;
    }, [allReviews]);

    const handleSubmit = (review) => {
        setLocalReviews((prev) => [review, ...prev]);
        setShowForm(false);
    };

    return (
        <section className="reviews-section section" id="reviews">
            <h2 className="section-heading">Customer Reviews</h2>

            {/* ── Summary Bar ──────────────────── */}
            <div className="rs-summary">
                <div className="rs-avg">
                    <span className="rs-avg-number">{avgRating}</span>
                    <div className="rs-avg-details">
                        <span className="rs-avg-stars">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <span
                                    key={i}
                                    className={`rs-star ${i <= Math.round(Number(avgRating)) ? 'rs-star--filled' : ''}`}
                                >
                                    ★
                                </span>
                            ))}
                        </span>
                        <span className="rs-total">
                            {allReviews.length} review{allReviews.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Rating breakdown bars */}
                <div className="rs-breakdown">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingBreakdown[star - 1];
                        const pct = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
                        return (
                            <div className="rs-bar-row" key={star}>
                                <span className="rs-bar-label">{star}★</span>
                                <div className="rs-bar-track">
                                    <div
                                        className="rs-bar-fill"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="rs-bar-count">{count}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="rs-actions">
                    <button className="rs-write-btn" onClick={() => setShowForm(true)}>
                        ✏️ Write a Review
                    </button>
                </div>
            </div>

            {/* ── Sort + List ──────────────────── */}
            {allReviews.length > 0 && (
                <>
                    <div className="rs-toolbar">
                        <span className="rs-toolbar-label">Sort by</span>
                        <select
                            className="rs-sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Rated</option>
                            <option value="lowest">Lowest Rated</option>
                        </select>
                    </div>

                    <div className="rs-list">
                        {sortedReviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                </>
            )}

            {allReviews.length === 0 && (
                <div className="rs-empty">
                    <p>No reviews yet. Be the first to share your experience!</p>
                    <button className="rs-write-btn" onClick={() => setShowForm(true)}>
                        ✏️ Write the First Review
                    </button>
                </div>
            )}

            {/* ── Review Form Modal ──────────── */}
            {showForm && (
                <ReviewForm
                    carId={carId}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowForm(false)}
                />
            )}
        </section>
    );
}
