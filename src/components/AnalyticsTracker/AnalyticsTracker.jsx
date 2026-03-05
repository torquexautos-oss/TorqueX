import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Silent component that logs page views and user activity to Firestore.
 * This powers the Dev Console / Admin Dashboard.
 */
export default function AnalyticsTracker() {
    const location = useLocation();
    const { currentUser } = useAuth();

    useEffect(() => {
        const logPageView = async () => {
            try {
                await addDoc(collection(db, 'analytics_traffic'), {
                    path: location.pathname,
                    userId: currentUser?.uid || 'anonymous',
                    userEmail: currentUser?.email || 'anonymous',
                    timestamp: serverTimestamp(),
                    userAgent: navigator.userAgent,
                    referrer: document.referrer || 'direct'
                });
            } catch (err) {
                // Silently fail to not disrupt user experience
                console.warn('[Analytics] Failed to log view');
            }
        };

        logPageView();
    }, [location.pathname, currentUser]);

    return null;
}
