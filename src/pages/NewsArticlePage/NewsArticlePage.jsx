import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { AlertCircle, ArrowLeft, Calendar, ExternalLink, Globe } from 'lucide-react';
import CommentsView from '../../components/CommentsView/CommentsView';
import { API_BASE_URL } from '../../config';
import { db } from '../../firebase';
import './NewsArticlePage.css';

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function NewsArticlePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [articleMeta, setArticleMeta] = useState(null);
    const [content, setContent] = useState('');
    const [leadImage, setLeadImage] = useState(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchArticleAndContent = async () => {
            setMetaLoading(true);
            setContentLoading(true);
            setError('');
            let metaUrl = '';
            let metaData = null;

            try {
                // 1. Fetch metadata from Firestore
                const docRef = doc(db, 'feed_articles', id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    throw new Error("Article not found in database.");
                }

                metaData = docSnap.data();
                setArticleMeta(metaData);
                metaUrl = metaData.url;
            } catch (err) {
                console.error("Error loading article metadata:", err);
                setError(err.message || 'Failed to load the article.');
            } finally {
                setMetaLoading(false); // Stop main loading instantly!
            }

            if (metaUrl) {
                try {
                    const controller = new AbortController();
                    // Timeout after 12 seconds to allow slower or international publishers
                    const timeoutId = setTimeout(() => controller.abort(), 12000);

                    // 2. Fetch full HTML content from local Node proxy parser asynchronously
                    // Using POST now to avoid "URL Too Long" errors for large RSS fallback content
                    const res = await fetch(`${API_BASE_URL}/api/article-content`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: metaUrl,
                            rssContent: metaData?.fullContent
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    // Handle non-OK status but still attempt to catch the JSON message
                    if (!res.ok) {
                        try {
                            const errorData = await res.json();
                            console.warn("Extraction failed:", errorData.error);
                        } catch {
                            console.warn("Extraction failed with status", res.status);
                        }
                        // Fallback logic
                        if (metaData?.fullContent && metaData.fullContent.length > 250) {
                            setContent(metaData.fullContent);
                            setLeadImage(metaData.imageUrl);
                            setContentLoading(false);
                            return;
                        }
                        throw new Error("Failed to extract content");
                    }

                    const data = await res.json();

                    if (data.content && data.content.length > 50) {
                        setContent(data.content);
                        setLeadImage(data.lead_image_url || metaData?.imageUrl || null);
                    } else {
                        // All attempts at extraction failed, using DB description as a last resort
                        throw new Error("Empty content returned");
                    }
                } catch (err) {
                    console.error("Error loading article content:", err);

                    // If we have fullContent already, use it instead of showing an error
                    if (metaData?.fullContent && metaData.fullContent.length > 100) {
                        setContent(metaData.fullContent);
                        setLeadImage(metaData.imageUrl);
                    } else if (err.name === 'AbortError') {
                        // Timeout fallback
                        setContent(
                            `<p class="reader-fallback-desc" style="color: var(--text-secondary); font-size: 1.25rem; line-height: 1.7; font-weight: 500;">${metaData?.description || ''}</p>
                             <div class="reader-fallback-error" style="color: #ef4444; margin-top: 2rem; padding: 1.5rem; border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.03); font-family: 'Rajdhani', sans-serif;">
                               <strong style="display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Extraction Timeout</strong>
                               <small style="font-size: 0.85rem; opacity: 0.8;">The external publisher site took too long to synchronize. Please check your network or read the original link.</small>
                             </div>`
                        );
                    } else {
                        setContent(
                            `<p class="reader-fallback-desc" style="color: var(--text-secondary); font-size: 1.25rem; line-height: 1.7; font-weight: 500;">${metaData?.description || ''}</p>
                             <div class="reader-fallback-error" style="color: #ef4444; margin-top: 2rem; padding: 1.5rem; border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.03); font-family: 'Rajdhani', sans-serif;">
                               <strong style="display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Publisher Handshake Failed</strong>
                               <small style="font-size: 0.85rem; opacity: 0.8;">Note: TorqueX could not bypass this publisher's specific security headers. Please access the original source via the button above for the full technical analysis.</small>
                             </div>`
                        );
                    }
                } finally {
                    setContentLoading(false);
                }
            }
        };

        if (id) {
            fetchArticleAndContent();
            window.scrollTo(0, 0);
        }
    }, [id]);

    if (metaLoading) {
        return (
            <div className="article-page-loading">
                <div className="spinner"></div>
                <p>Loading article content...</p>
            </div>
        );
    }

    if (error || !articleMeta) {
        return (
            <div className="article-page-error container">
                <AlertCircle size={48} className="error-icon" />
                <h2>Article Not Found</h2>
                <p>{error}</p>
                <button className="btn-primary" onClick={() => navigate('/news')}>
                    <ArrowLeft size={16} /> Back to Newsfeed
                </button>
            </div>
        );
    }

    return (
        <main className="news-article-page">
            <div className="article-container">
                {/* Back Button */}
                <button className="back-btn" onClick={() => navigate('/news')}>
                    <ArrowLeft size={18} /> Back to Feed
                </button>

                {/* Article Header */}
                <header className="article-header">
                    <div className="article-meta-tags">
                        {articleMeta.source && (
                            <span className="source-tag">
                                {articleMeta.source}
                            </span>
                        )}
                        <span className="time-tag">
                            <Calendar size={14} /> {timeAgo(articleMeta.publishedAt)}
                        </span>
                    </div>

                    <h1 className="article-title">{articleMeta.title}</h1>

                    <a href={articleMeta.url} target="_blank" rel="noopener noreferrer" className="read-original-btn">
                        <Globe size={16} /> Read Original on {articleMeta.source || 'Source'} <ExternalLink size={14} />
                    </a>
                </header>

                <div className="article-body">
                    {contentLoading ? (
                        <div className="content-skeleton slide-up">
                            <div className="magical-spinner" style={{ margin: '2rem auto' }}></div>
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Extracting publisher content...</p>
                        </div>
                    ) : (
                        <>
                            <div className="article-hero-wrapper">
                                <div className="article-hero-fallback">
                                    <Globe size={48} strokeWidth={1} />
                                    <span>OPTIMIZING_VIEW_PORT...</span>
                                </div>
                                {leadImage && (
                                    <img
                                        src={leadImage}
                                        alt={articleMeta?.title || "Article Header"}
                                        className="article-hero-image fade-in"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                            </div>
                            <div
                                className="article-html-content fade-in"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        </>
                    )}
                </div>

                <hr className="article-divider" />

                {/* Comments Section */}
                <div className="article-comments-wrapper">
                    <CommentsView targetId={`news_${id}`} type="news" />
                </div>
            </div>
        </main>
    );
}
