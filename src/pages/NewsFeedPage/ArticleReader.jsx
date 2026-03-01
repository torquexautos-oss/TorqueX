import { useState, useEffect } from 'react';
import './ArticleReader.css';

function ArticleReader({ article, onClose }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Truncate content to show only preview (first 2-3 paragraphs or ~300 chars)
    const getPreviewContent = (content) => {
        if (!content) return '';
        const preview = content.substring(0, 300);
        return preview + (content.length > 300 ? '...' : '');
    };

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Lock body scroll when overlay is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!article) return null;

    return (
        <div className="reader-overlay" onClick={onClose}>
            <div className="reader-content" onClick={(e) => e.stopPropagation()}>

                {/* Header with Back Button */}
                <button className="reader-back" onClick={onClose}>
                    ← Back to Feed
                </button>

                {/* Article Metadata */}
                <div className="reader-meta">
                    {article.sourceIcon && (
                        <img
                            src={article.sourceIcon}
                            alt={article.source}
                            className="source-icon"
                        />
                    )}
                    <span className="source-name">{article.source}</span>
                    <span className="article-time">{
                        new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    }</span>
                </div>

                {/* Article Title */}
                <h1 className="reader-title">{article.title}</h1>

                {/* Read Original Button - Prominent placement */}
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-original-btn"
                >
                    🔗 Read Original on {article.source}
                </a>

                {/* Article Media - HIGH QUALITY, NO BLUR */}
                <div className="reader-media">
                    {!imageLoaded && (
                        <div className="image-loading">Loading image...</div>
                    )}

                    <img
                        src={article.imageUrl || article.urlToImage || article.image}
                        alt={article.title}
                        className="reader-image"
                        loading="eager"
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                        style={{ display: imageLoaded ? 'block' : 'none' }}
                    />
                </div>

                {/* Short Content Preview */}
                <div className="reader-body">
                    <p className="reader-preview">
                        {article.description || getPreviewContent(article.content)}
                    </p>

                    <p className="read-more-prompt">
                        👉 Read the full article on {article.source}
                    </p>
                </div>

                {/* Bottom Read Original Button */}
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-original-btn read-original-bottom"
                >
                    Continue Reading on {article.source} →
                </a>

            </div>
        </div>
    );
}

export default ArticleReader;
