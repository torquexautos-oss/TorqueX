import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSearchParams, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import CommentsView from '../../components/CommentsView/CommentsView';
import { API_BASE_URL } from '../../config';
import './NewsPage.css';

export default function NewsPage() {
    const [searchParams] = useSearchParams();
    const targetSlug = searchParams.get('article');
    const location = useLocation();

    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [feed, setFeed] = useState([]);

    // Fetch recent articles from Firestore to act as the News Feed
    useEffect(() => {
        const q = query(
            collection(db, 'news_articles'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setFeed(fetched);
        }, (err) => {
            console.error("Error fetching news feed:", err);
        });

        return () => unsubscribe();
    }, []);

    // Auto-Scroll to specific article if a user clicked a deep link from their Profile (but wasn't targeting a specific comment)
    useEffect(() => {
        if (targetSlug && feed.length > 0 && !location.hash) {
            const articleElement = document.getElementById(`article-${targetSlug}`);
            if (articleElement) {
                setTimeout(() => {
                    articleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        }
    }, [targetSlug, feed.length, location.hash]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/generate-news`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate news');
            }

            const data = await res.json();
            const slug = topic.replace(/\s+/g, '-').toLowerCase();

            // Permanently save the generated article for the entire platform to see
            await addDoc(collection(db, 'news_articles'), {
                topic,
                slug,
                article: data.article,
                sources: data.sources,
                createdAt: serverTimestamp()
            });

            setTopic('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="news-page container">
            <header className="news-header">
                <h1>AI Automotive News</h1>
                <p>Generate Wikipedia-style, fully-referenced articles on any automotive topic instantly.</p>
            </header>

            <section className="news-generator">
                <form onSubmit={handleGenerate} className="generator-form">
                    <input
                        type="text"
                        placeholder="E.g. History of the Tesla Model S..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" className="btn-primary" disabled={loading || !topic.trim()}>
                        {loading ? 'Generating...' : 'Generate Article'}
                    </button>
                </form>
                {loading && (
                    <div className="loading-indicator">
                        <div className="spinner"></div>
                        <p>Searching the web and compiling references...</p>
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}
            </section>

            <section className="news-feed">
                {feed.length === 0 && !loading && (
                    <div className="no-news" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '1.1rem' }}>
                        <p>No articles generated yet. Be the first to contribute to the TorqueX database!</p>
                    </div>
                )}

                {feed.map((item) => (
                    <article
                        key={item.id}
                        id={`article-${item.slug}`}
                        className={`generated-article feed-item ${targetSlug === item.slug ? 'highlighted-article' : ''}`}
                        style={{ marginBottom: '4rem' }}
                    >
                        <h2 className="article-topic-title" style={{ fontSize: '2.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                            {item.topic}
                        </h2>

                        <div className="article-body">
                            <ReactMarkdown>{item.article}</ReactMarkdown>
                        </div>

                        {item.sources && item.sources.length > 0 && (
                            <div className="article-sources">
                                <h3>Source References</h3>
                                <ul>
                                    {item.sources.map((src, idx) => (
                                        <li key={idx}>
                                            <a href={src.url} target="_blank" rel="noopener noreferrer">
                                                [{idx + 1}] {src.title || src.url}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <CommentsView targetId={`news_${item.id}`} type="news" />
                    </article>
                ))}
            </section>
        </main>
    );
}
