import { useState } from 'react';
import './ReviewForm.css';

export default function ReviewForm({ carId, onSubmit, onCancel }) {
    const [form, setForm] = useState({
        username: '',
        rating: 5,
        title: '',
        reviewText: '',
        pros: '',
        cons: '',
        ownershipDuration: '',
    });
    const [hoverRating, setHoverRating] = useState(0);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.username.trim() || !form.reviewText.trim()) return;

        const review = {
            id: `rev-${Date.now()}`,
            carId,
            username: form.username.trim(),
            rating: Number(form.rating),
            title: form.title.trim() || 'My Review',
            reviewText: form.reviewText.trim(),
            pros: form.pros
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            cons: form.cons
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            ownershipDuration: form.ownershipDuration.trim() || 'Not specified',
            date: new Date().toISOString().split('T')[0],
        };

        onSubmit(review);
        setForm({
            username: '',
            rating: 5,
            title: '',
            reviewText: '',
            pros: '',
            cons: '',
            ownershipDuration: '',
        });
    };

    return (
        <div className="rf-overlay" onClick={onCancel}>
            <form
                className="rf-form"
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rf-header">
                    <h3 className="rf-heading">Write a Review</h3>
                    <button type="button" className="rf-close" onClick={onCancel}>
                        ✕
                    </button>
                </div>

                {/* Rating */}
                <div className="rf-field">
                    <label className="rf-label">Your Rating</label>
                    <div className="rf-star-input">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <button
                                key={i}
                                type="button"
                                className={`rf-star ${i <= (hoverRating || form.rating)
                                        ? 'rf-star--active'
                                        : ''
                                    }`}
                                onMouseEnter={() => setHoverRating(i)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() =>
                                    setForm((prev) => ({ ...prev, rating: i }))
                                }
                            >
                                ★
                            </button>
                        ))}
                        <span className="rf-rating-text">
                            {form.rating}/5
                        </span>
                    </div>
                </div>

                {/* Name + Ownership row */}
                <div className="rf-row">
                    <div className="rf-field">
                        <label className="rf-label" htmlFor="rf-username">
                            Name <span className="rf-required">*</span>
                        </label>
                        <input
                            id="rf-username"
                            name="username"
                            type="text"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Your name"
                            required
                        />
                    </div>
                    <div className="rf-field">
                        <label className="rf-label" htmlFor="rf-ownership">
                            Ownership Duration
                        </label>
                        <input
                            id="rf-ownership"
                            name="ownershipDuration"
                            type="text"
                            value={form.ownershipDuration}
                            onChange={handleChange}
                            placeholder="e.g. 6 months, 1 year"
                        />
                    </div>
                </div>

                {/* Title */}
                <div className="rf-field">
                    <label className="rf-label" htmlFor="rf-title">
                        Review Title
                    </label>
                    <input
                        id="rf-title"
                        name="title"
                        type="text"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Summarize your experience"
                    />
                </div>

                {/* Review text */}
                <div className="rf-field">
                    <label className="rf-label" htmlFor="rf-review">
                        Full Review <span className="rf-required">*</span>
                    </label>
                    <textarea
                        id="rf-review"
                        name="reviewText"
                        value={form.reviewText}
                        onChange={handleChange}
                        placeholder="Share your ownership experience in detail..."
                        rows={5}
                        required
                    />
                </div>

                {/* Pros & Cons */}
                <div className="rf-row">
                    <div className="rf-field">
                        <label className="rf-label" htmlFor="rf-pros">
                            Pros <span className="rf-hint">(one per line)</span>
                        </label>
                        <textarea
                            id="rf-pros"
                            name="pros"
                            value={form.pros}
                            onChange={handleChange}
                            placeholder={"Good mileage\nSmooth engine\nFeature-rich"}
                            rows={3}
                        />
                    </div>
                    <div className="rf-field">
                        <label className="rf-label" htmlFor="rf-cons">
                            Cons <span className="rf-hint">(one per line)</span>
                        </label>
                        <textarea
                            id="rf-cons"
                            name="cons"
                            value={form.cons}
                            onChange={handleChange}
                            placeholder={"Road noise\nAverage boot space\nNo sunroof"}
                            rows={3}
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="rf-actions">
                    <button type="button" className="rf-btn rf-btn--cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="rf-btn rf-btn--submit">
                        Submit Review
                    </button>
                </div>
            </form>
        </div>
    );
}
