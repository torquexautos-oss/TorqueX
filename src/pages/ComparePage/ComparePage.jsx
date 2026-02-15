import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import CompareTable from '../../components/CompareTable/CompareTable';
import './ComparePage.css';

export default function ComparePage() {
    const { compareList, removeFromCompare, clearCompare } = useCompare();

    return (
        <main className="compare-page container">
            <div className="compare-header">
                <h1>Compare Cars</h1>
                <p className="compare-subtitle">
                    {compareList.length === 0
                        ? 'No cars selected. Go to the car listings and click "+ Compare" on any car card.'
                        : compareList.length === 1
                            ? '1 car selected. Add one more to compare side by side.'
                            : 'Comparing 2 cars side by side.'
                    }
                </p>
                {compareList.length > 0 && (
                    <button className="compare-clear" onClick={clearCompare}>
                        Clear All
                    </button>
                )}
            </div>

            {compareList.length > 0 ? (
                <CompareTable cars={compareList} onRemove={removeFromCompare} />
            ) : (
                <div className="compare-empty">
                    <p>Select up to 2 cars from the listings to compare.</p>
                    <Link to="/cars" className="compare-browse">Browse Cars →</Link>
                </div>
            )}

            <div className="compare-back">
                <Link to="/cars" className="link-back">← Back to listings</Link>
            </div>
        </main>
    );
}
