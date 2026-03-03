import React, { useState } from 'react';
import './SearchBar.css';

const PLACEHOLDERS = [
    "Search by car name or brand...",
    "Try 'GT-R' or 'Porsche 911'...",
    "Looking for the next 'M3' killer?",
    "Search engines... and cars too.",
    "BHP, torque, or just 'Thar'...",
    "Looking for a sleeper?",
    "Is it a Supra?!",
    "Searching for 10-second cars...",
    "VTEC just kicked in, yo!"
];

export default function SearchBar({ value, onChange }) {
    const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

    return (
        <div className="search-bar">
            <input
                type="text"
                placeholder={placeholder}
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
