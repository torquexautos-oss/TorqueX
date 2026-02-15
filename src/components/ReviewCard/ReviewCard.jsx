import './ReviewCard.css';

function StarRating({ rating }) {
    return (
        <span className="rc-stars" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`rc-star ${i <= rating ? 'rc-star--filled' : ''}`}>
                    ★
                </span>
            ))}
        </span>
    );
}

export default function ReviewCard({ review }) {
    const formattedDate = new Date(review.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <article className="review-card">
            <div className="rc-header">
                <div className="rc-user">
                    <div className="rc-avatar">{review.username.charAt(0).toUpperCase()}</div>
                    <div className="rc-user-info">
                        <span className="rc-username">{review.username.replace(/_/g, ' ')}</span>
                        <span className="rc-ownership">
                            Owned for {review.ownershipDuration}
                        </span>
                    </div>
                </div>
                <div className="rc-meta">
                    <StarRating rating={review.rating} />
                    <span className="rc-date">{formattedDate}</span>
                </div>
            </div>

            <h4 className="rc-title">{review.title}</h4>
            <p className="rc-body">{review.reviewText}</p>

            <div className="rc-verdict">
                {review.pros && review.pros.length > 0 && (
                    <div className="rc-pros">
                        <span className="rc-verdict-label rc-verdict-label--pro">👍 Liked</span>
                        <ul>
                            {review.pros.map((p, i) => (
                                <li key={i}>{p}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {review.cons && review.cons.length > 0 && (
                    <div className="rc-cons">
                        <span className="rc-verdict-label rc-verdict-label--con">👎 Disliked</span>
                        <ul>
                            {review.cons.map((c, i) => (
                                <li key={i}>{c}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </article>
    );
}
