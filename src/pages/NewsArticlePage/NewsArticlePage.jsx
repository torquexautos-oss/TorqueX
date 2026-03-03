import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    const [metaLoading, setMetaLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchArticleAndContent = async () => {
            setMetaLoading(true);
            setContentLoading(true);
            setError('');
            let metaUrl = '';

            try {
                // 1. Fetch metadata from Firestore
                const docRef = doc(db, 'feed_articles', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const meta = docSnap.data();
                    setArticleMeta(meta);
                    metaUrl = meta.url;
                } else {
                    // Fallback for direct link sharing where nobody has clicked it yet.
                    // Instead of failing, we will query the live feed API.
                    // Since we don't have a direct 'getBySlug' we try a broad search using the slug.
                    const readableTitle = id.replace(/-/g, ' ');
                    const res = await fetch(`${API_BASE_URL}/api/feed?q=${encodeURIComponent(readableTitle)}&limit=10`);
                    if (res.ok) {
                        const data = await res.json();
                        // Find the exact match or closest match
                        const match = data.articles?.find(a => a.id === id) || data.articles?.[0];
                        if (match) {
                            setArticleMeta(match);
                            metaUrl = match.url;

                            // Save it back to Firestore immediately so comments work
                            await setDoc(docRef, {
                                id: match.id,
                                title: match.title,
                                url: match.url,
                                source: match.source,
                                sourceIcon: match.sourceIcon || null,
                                publishedAt: match.publishedAt,
                                description: match.description,
                                createdAt: serverTimestamp()
                            }, { merge: true });
                        } else {
                            throw new Error("Article has expired from the live feed or does not exist.");
                        }
                    } else {
                        throw new Error("Failed to fetch article details from live feed.");
                    }
                }
            } catch (err) {
                console.error("Error loading article metadata:", err);
                setError(err.message || 'Failed to load the article.');
            } finally {
                setMetaLoading(false); // Stop main loading instantly!
            }

            if (metaUrl) {
                try {
                    const controller = new AbortController();
                    // Timeout after 3.5 seconds to prevent hanging and improve user experience
                    const timeoutId = setTimeout(() => controller.abort(), 3500);

                    // 2. Fetch full HTML content from local Node proxy parser asynchronously
                    const res = await fetch(`${API_BASE_URL}/api/article-content?url=${encodeURIComponent(metaUrl)}`, {
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);
                    const data = await res.json();

                    if (res.ok && data.content && data.content.length > 50) {
                        setContent(data.content);
                    } else {
                        // Fallback to description
                        setContent(
                            `<p class="reader-fallback-desc" style="color: #ccc; font-size: 1.1rem; line-height: 1.6;">${articleMeta?.description || ''}</p>
                             <p class="reader-fallback-error" style="color: #ef4444; margin-top: 1.5rem; padding: 1rem; border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; background: rgba(239,68,68,0.05);">
                               <small><strong>Note:</strong> TorqueX could not extract the full text for this specific publisher format. Please read the original source for the complete story.</small>
                             </p>`
                        );
                    }
                } catch (err) {
                    console.error("Error loading article content:", err);

                    if (err.name === 'AbortError') {
                        // Timeout fallback
                        setContent(
                            `<p class="reader-fallback-desc" style="color: #ccc; font-size: 1.1rem; line-height: 1.6;">${articleMeta?.description || ''}</p>
                             <p class="reader-fallback-error" style="color: #ef4444; margin-top: 1.5rem; padding: 1rem; border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; background: rgba(239,68,68,0.05);">
                               <small><strong>Timeout:</strong> The external publisher site took too long to respond. Read the full story on their site.</small>
                             </p>`
                        );
                    } else {
                        setContent(
                            `<p class="reader-fallback-error" style="color: #ef4444; margin-top: 1rem;">
                               <small>Failed to connect to extraction server. Please read original link.</small>
                             </p>`
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
                                {articleMeta.sourceIcon && <img src={articleMeta.sourceIcon} alt="" className="source-icon-small" />}
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

                {/* Article Content */}
                <div className="article-body">
                    {contentLoading ? (
                        <div className="content-skeleton slide-up">
                            <div className="magical-spinner" style={{ margin: '2rem auto' }}></div>
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Extracting publisher content...</p>
                        </div>
                    ) : (
                        <div
                            className="article-html-content fade-in"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
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
