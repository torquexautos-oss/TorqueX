import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc,
    arrayUnion
} from 'firebase/firestore';
import { MessageSquare, Trash2, ShieldAlert, User, Reply, CornerDownRight } from 'lucide-react';
import './CommentsView.css';

// Simple Auto-Moderation (Profanity Filter)
const BAD_WORDS = ['crap', 'shit', 'idiot', 'stupid', 'dumb', 'fuck', 'ass', 'bitch'];

const containsProfanity = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    return words.some(word => BAD_WORDS.includes(word));
};

export default function CommentsView({ targetId, type }) {
    const { currentUser, isSuperUser, openAuthModal } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(0);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [commentsList, setCommentsList] = useState([]);

    // Reply State
    const [replyingTo, setReplyingTo] = useState(null); // comment ID
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    useEffect(() => {
        if (!targetId) return;

        const q = query(
            collection(db, 'comments'),
            where('targetId', '==', targetId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort locally to avoid Firebase composite index requirement
            fetchedComments.sort((a, b) => {
                const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return dateB - dateA;
            });

            setCommentsList(fetchedComments);
        }, (err) => {
            console.error("Error fetching comments:", err);
        });

        return () => unsubscribe();
    }, [targetId]);

    // Handle hash scrolling for deep linking from the Profile page
    const location = useLocation();
    useEffect(() => {
        const expectedHash = `#comments-${targetId}`;
        if (location.hash === expectedHash) {
            const element = document.getElementById(`comments-${targetId}`);
            if (element) {
                // Short timeout to guarantee DOM is rendered before jumping
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            }
        }
    }, [location.hash, commentsList.length, targetId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const text = newComment.trim();
        if (!text) return;

        if (type === 'car' && rating === 0) {
            setError('Please select a rating before submitting your review.');
            return;
        }

        if (containsProfanity(text)) {
            setError('Your comment contains inappropriate language. Please revise it.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await addDoc(collection(db, 'comments'), {
                targetId,
                type,
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Anonymous User',
                userEmail: currentUser.email,
                text: text,
                rating: type === 'car' ? rating : null,
                createdAt: serverTimestamp()
            });
            setNewComment('');
            setRating(0);
        } catch (err) {
            console.error("Error posting comment:", err);
            setError('Failed to post comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReplySubmit = async (e, parentId, existingReplies = []) => {
        e.preventDefault();
        if (!currentUser) return;

        const text = replyText.trim();
        if (!text) return;

        if (existingReplies.length >= 20) {
            setError('This thread has reached the maximum of 20 replies.');
            return;
        }

        if (containsProfanity(text)) {
            setError('Your reply contains inappropriate language. Please revise it.');
            return;
        }

        setIsReplying(true);
        setError('');

        try {
            const commentRef = doc(db, 'comments', parentId);
            const newReply = {
                id: Date.now().toString(), // local unique ID for the array
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Anonymous User',
                userEmail: currentUser.email,
                text: text,
                createdAt: new Date().toISOString() // Can't easily use serverTimestamp inside arrayUnion for nested objects
            };

            await updateDoc(commentRef, {
                replies: arrayUnion(newReply)
            });

            setReplyingTo(null);
            setReplyText('');
        } catch (err) {
            console.error("Error posting reply:", err);
            setError('Failed to post reply. Please try again.');
        } finally {
            setIsReplying(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        try {
            await deleteDoc(doc(db, 'comments', commentId));
        } catch (err) {
            console.error("Error deleting comment:", err);
            alert('Failed to delete comment.');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        }).format(date);
    };

    return (
        <div id={`comments-${targetId}`} className={`comments-section ${type === 'news' ? 'theme-news' : ''}`}>
            <div className="comments-header">
                <h3>
                    <MessageSquare size={20} />
                    Discussion ({commentsList.length})
                </h3>
                {isSuperUser && (
                    <span className="moderator-badge">
                        <ShieldAlert size={14} /> Mod Mode Active
                    </span>
                )}
            </div>

            <div className="comments-composer">
                {currentUser ? (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="comment-error">{error}</div>}

                        {type === 'car' && (
                            <div className="rating-selector">
                                <label>Your Rating: {rating > 0 ? rating : '-'} / 10</label>
                                <div className="rating-buttons">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            className={`rate-btn ${rating === num ? 'active' : ''}`}
                                            onClick={() => {
                                                setRating(num);
                                                setError('');
                                            }}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <textarea
                            value={newComment}
                            onChange={(e) => {
                                setNewComment(e.target.value);
                                setError('');
                            }}
                            placeholder={type === 'car' ? "Write your review... (Keep it respectful)" : "Join the discussion... (Keep it respectful)"}
                            rows={3}
                            maxLength={500}
                        />
                        <div className="composer-footer">
                            <span className="char-count">{newComment.length}/500</span>
                            <button
                                type="submit"
                                className="comment-submit-btn"
                                disabled={isSubmitting || !newComment.trim()}
                            >
                                {isSubmitting ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="login-prompt">
                        <User size={32} className="login-prompt-icon" />
                        <p>{type === 'car' ? "Have an opinion on this car? Log in to leave a review." : "Want to join the conversation? Log in to post a comment."}</p>
                        <button className="login-prompt-btn" onClick={() => openAuthModal()}>
                            Sign In / Sign Up
                        </button>
                    </div>
                )}
            </div>

            <div className="comments-list">
                {commentsList.length === 0 ? (
                    <div className="no-comments">
                        <p>No comments yet. Be the first to start the discussion!</p>
                    </div>
                ) : (
                    commentsList.map(comment => (
                        <div key={comment.id} className={`comment-card ${comment.userEmail === currentUser?.email ? 'my-comment' : ''}`}>
                            <div className="comment-avatar">
                                {comment.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="comment-body">
                                <div className="comment-meta">
                                    <span className="comment-author">{comment.userName}</span>
                                    {comment.rating && (
                                        <span className="comment-rating-badge">
                                            {comment.rating} / 10
                                        </span>
                                    )}
                                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="comment-text">{comment.text}</p>
                            </div>

                            {/* Comment Actions (Reply / Delete) */}
                            <div className="comment-actions">
                                <button
                                    className="action-btn reply-btn"
                                    onClick={() => {
                                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                        setReplyText('');
                                        setError('');
                                    }}
                                >
                                    <Reply size={14} /> Reply
                                </button>

                                {(isSuperUser || comment.userId === currentUser?.uid) && (
                                    <button
                                        className="action-btn delete-btn"
                                        onClick={() => handleDelete(comment.id)}
                                        title="Delete Comment"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                )}
                            </div>

                            {/* Replies List */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="replies-list">
                                    {comment.replies.map(reply => (
                                        <div key={reply.id} className="reply-card">
                                            <CornerDownRight size={16} className="reply-connector-icon" />
                                            <div className="comment-avatar reply-avatar">
                                                {reply.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="comment-body">
                                                <div className="comment-meta">
                                                    <span className="comment-author">{reply.userName}</span>
                                                    <span className="comment-date">
                                                        {new Intl.DateTimeFormat('en-US', {
                                                            month: 'short', day: 'numeric',
                                                            hour: 'numeric', minute: '2-digit'
                                                        }).format(new Date(reply.createdAt))}
                                                    </span>
                                                </div>
                                                <p className="comment-text">{reply.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply Composer */}
                            {replyingTo === comment.id && (
                                <div className="reply-composer-wrapper">
                                    {currentUser ? (
                                        <form className="reply-form" onSubmit={(e) => handleReplySubmit(e, comment.id, comment.replies)}>
                                            <CornerDownRight size={20} className="reply-connector-icon active" />
                                            <div className="reply-input-box">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) => {
                                                        setReplyText(e.target.value);
                                                        setError('');
                                                    }}
                                                    placeholder="Write a reply... (Max 20 per thread)"
                                                    maxLength={300}
                                                    autoFocus
                                                />
                                                <button
                                                    type="submit"
                                                    className="reply-submit-btn"
                                                    disabled={isReplying || !replyText.trim() || (comment.replies && comment.replies.length >= 20)}
                                                >
                                                    {isReplying ? '...' : 'Reply'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="reply-login-prompt">
                                            <span>Please sign in to reply to this thread.</span>
                                            <button onClick={() => openAuthModal()}>Sign In</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
