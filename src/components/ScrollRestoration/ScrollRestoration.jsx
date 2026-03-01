import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Stores scroll positions per pathname and restores them on navigation
const scrollPositions = {};

export default function ScrollRestoration() {
    const { pathname } = useLocation();
    const prevPath = useRef(pathname);

    // Save scroll on every scroll event
    useEffect(() => {
        const save = () => {
            scrollPositions[pathname] = window.scrollY;
        };
        window.addEventListener('scroll', save, { passive: true });
        return () => window.removeEventListener('scroll', save);
    }, [pathname]);

    // On route change: save previous, restore current
    useEffect(() => {
        if (prevPath.current !== pathname) {
            // Save the old position
            scrollPositions[prevPath.current] = window.scrollY;
            prevPath.current = pathname;

            // Restore the saved position for the new route, or scroll to top
            const saved = scrollPositions[pathname];
            requestAnimationFrame(() => {
                window.scrollTo(0, saved ?? 0);
            });
        }
    }, [pathname]);

    return null;
}
