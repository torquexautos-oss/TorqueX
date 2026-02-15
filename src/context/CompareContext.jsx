import { createContext, useContext, useState } from 'react';

const CompareContext = createContext();

export function CompareProvider({ children }) {
    const [compareList, setCompareList] = useState([]);

    const addToCompare = (car) => {
        setCompareList((prev) => {
            if (prev.length >= 2) return prev;
            if (prev.find((c) => c.id === car.id)) return prev;
            return [...prev, car];
        });
    };

    const removeFromCompare = (carId) => {
        setCompareList((prev) => prev.filter((c) => c.id !== carId));
    };

    const isInCompare = (carId) => {
        return compareList.some((c) => c.id === carId);
    };

    const clearCompare = () => {
        setCompareList([]);
    };

    return (
        <CompareContext.Provider value={{
            compareList,
            addToCompare,
            removeFromCompare,
            isInCompare,
            clearCompare,
        }}>
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    const ctx = useContext(CompareContext);
    if (!ctx) throw new Error('useCompare must be used within CompareProvider');
    return ctx;
}
