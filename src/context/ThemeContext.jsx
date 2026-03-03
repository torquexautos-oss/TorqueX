import React, { createContext, useContext, useState, useEffect } from 'react'; /* eslint-disable react-refresh/only-export-components */

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme-preference');
        return saved || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('theme-preference', theme);
        document.documentElement.setAttribute('data-theme', theme);

        if (theme === 'light') {
            document.documentElement.classList.add('blueprint-mode');
        } else {
            document.documentElement.classList.remove('blueprint-mode');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    const isBlueprintMode = theme === 'light';

    return (
        <ThemeContext.Provider value={{ theme, isBlueprintMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
