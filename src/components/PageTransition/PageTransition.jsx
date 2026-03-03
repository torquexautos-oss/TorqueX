import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
    initial: {
        clipPath: 'inset(0 0 100% 0)',
        opacity: 0,
        filter: 'brightness(2) contrast(1.2)',
    },
    animate: {
        clipPath: 'inset(0 0 0% 0)',
        opacity: 1,
        filter: 'brightness(1) contrast(1)',
        transition: {
            duration: 0.4,
            ease: [0.19, 1, 0.22, 1], // Custom mechanical snap
        },
    },
    exit: {
        clipPath: 'inset(100% 0 0 0)',
        opacity: 0,
        filter: 'brightness(0.5) contrast(1.5)',
        transition: {
            duration: 0.3,
            ease: [0.19, 1, 0.22, 1],
        },
    },
};

export default function PageTransition({ children }) {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
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
