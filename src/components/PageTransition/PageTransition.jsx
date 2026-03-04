import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Simple, cross-platform transition — avoids clipPath which breaks on
// mobile WebKit/Chrome when using browser back/forward, causing blank screens.
const pageVariants = {
    initial: {
        opacity: 0,
        y: 12,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.19, 1, 0.22, 1],
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: {
            duration: 0.2,
            ease: [0.19, 1, 0.22, 1],
        },
    },
};

export default function PageTransition({ children }) {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ width: '100%', minHeight: '100vh' }}
            >
                {children}
            </Motion.div>
        </AnimatePresence>
    );
}
