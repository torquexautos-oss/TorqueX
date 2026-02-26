import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './NewsPage.css';

export default function NewsPage() {
    const [topic, setTopic] = useState('');
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sources, setSources] = useState([]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        setError(null);
        setArticle(null);
        setSources([]);

        try {
            const res = await fetch('http://localhost:3002/api/generate-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate news');
            }

            const data = await res.json();
            setArticle(data.article);
            setSources(data.sources);
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

            {article && !loading && (
                <article className="generated-article">
                    <ReactMarkdown>{article}</ReactMarkdown>

                    <div className="article-sources">
                        <h3>Source References</h3>
                        <ul>
                            {sources.map((src, idx) => (
                                <li key={idx}>
                                    <a href={src.url} target="_blank" rel="noopener noreferrer">
                                        [{idx + 1}] {src.title || src.url}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </article>
            )}
        </main>
    );
}
