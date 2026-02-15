import './SearchBar.css';

export default function SearchBar({ value, onChange }) {
    return (
        <div className="search-bar">
            <input
                type="text"
                placeholder="Search by car name or brand..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {value && (
                <button className="search-clear" onClick={() => onChange('')}>
                    ✕
                </button>
            )}
        </div>
    );
}
