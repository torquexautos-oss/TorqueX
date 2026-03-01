import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import './ArticleReader.css';

function ArticleReader({ article, onClose }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [fullContent, setFullContent] = useState('');
    const [contentLoading, setContentLoading] = useState(true);

    // Fetch full content preview
    useEffect(() => {
        if (!article?.url) return;
        const fetchContent = async () => {
            setContentLoading(true);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                const res = await fetch(`${API_BASE_URL}/api/article-content?url=${encodeURIComponent(article.url)}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const data = await res.json();

                if (res.ok && data.content && data.content.length > 50) {
                    setFullContent(data.content);
                } else {
                    setFullContent('');
                }
            } catch (err) {
                console.error("Failed to load full content preview", err);
                setFullContent('');
            } finally {
                setContentLoading(false);
            }
        };
        fetchContent();
    }, [article?.url]);

    // Smooth entrance animation
    useEffect(() => {
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Smooth exit animation
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    // Get excerpt (first 250 characters)
    const getExcerpt = (text) => {
        if (!text) return '';
        const cleaned = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
        return cleaned.length > 250
            ? cleaned.substring(0, 250) + '...'
            : cleaned;
    };

    // Format date nicely
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div
            className={`article-reader-overlay ${isVisible ? 'visible' : ''}`}
            onClick={handleClose}
        >
            <div
                className="article-reader-container"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Close Button - Floating */}
                <button
                    className="reader-close-btn"
                    onClick={handleClose}
                    aria-label="Close article"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Article Header */}
                <header className="article-header">
                    <div className="article-source-row">
                        <div className="source-info">
                            {article.sourceIcon && (
                                <img
                                    src={article.sourceIcon}
                                    alt={article.source}
                                    className="source-logo"
                                />
                            )}
                            <span className="source-name">{article.source || 'Unknown Source'}</span>
                        </div>
                        <time className="article-date">
                            {formatDate(article.publishedAt || article.date)}
                        </time>
                    </div>

                    <h1 className="article-title">{article.title}</h1>

                    {/* Category Tags */}
                    {article.category && (
                        <div className="article-tags">
                            <span className="tag">{article.category}</span>
                        </div>
                    )}
                </header>

                {/* Hero Image */}
                <div className="article-hero">
                    {!imageLoaded && !imageError && (
                        <div className="image-skeleton">
                            <div className="skeleton-shimmer"></div>
                        </div>
                    )}

                    {imageError && (
                        <div className="image-placeholder">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor" opacity="0.3" />
                            </svg>
                            <p>Image unavailable</p>
                        </div>
                    )}

                    <img
                        src={article.urlToImage || article.image || article.imageUrl}
                        alt={article.title}
                        className={`article-hero-image ${imageLoaded ? 'loaded' : ''}`}
                        loading="eager"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            setImageError(true);
                            console.error('Failed to load image:', article.urlToImage || article.image || article.imageUrl);
                        }}
                        style={{ display: imageError ? 'none' : 'block' }}
                    />

                    {/* Image Caption */}
                    {article.imageCaption && imageLoaded && (
                        <p className="image-caption">{article.imageCaption}</p>
                    )}
                </div>

                {/* Article Content Preview */}
                <article className="article-content">

                    {/* Excerpt with fade */}
                    <div className="article-excerpt">
                        {contentLoading ? (
                            <div className="content-skeleton-loader">
                                <div className="loading-skeleton-row" style={{ width: '100%' }}></div>
                                <div className="loading-skeleton-row" style={{ width: '90%' }}></div>
                                <div className="loading-skeleton-row" style={{ width: '95%' }}></div>
                                <div className="loading-skeleton-row" style={{ width: '85%' }}></div>
                                <div className="loading-skeleton-row" style={{ width: '90%' }}></div>
                            </div>
                        ) : fullContent ? (
                            <div
                                className="full-content-preview"
                                dangerouslySetInnerHTML={{ __html: fullContent }}
                            />
                        ) : (
                            <div className="fallback-excerpt">
                                <p>{article.description || getExcerpt(article.content)}</p>
                            </div>
                        )}
                        <div className="excerpt-fade"></div>
                    </div>

                    {/* Read More Callout */}
                    <div className="read-more-callout">
                        <div className="callout-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="callout-text">
                            <h3>Continue Reading</h3>
                            <p>Read the complete story with detailed analysis and exclusive content on {article.source}</p>
                        </div>
                    </div>

                    {/* Primary CTA */}
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="primary-cta"
                    >
                        <span>Read Full Article on {article.source}</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </a>

                    {/* Secondary Actions */}
                    <div className="secondary-actions">
                        <button className="action-btn share-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Share
                        </button>
                        <button className="action-btn bookmark-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Save
                        </button>
                    </div>

                </article>

                {/* Author Info (if available) */}
                {article.author && (
                    <div className="article-author">
                        <div className="author-avatar">
                            {article.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="author-details">
                            <p className="author-name">{article.author}</p>
                            <p className="author-role">Contributing Writer</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default React.memo(ArticleReader);
