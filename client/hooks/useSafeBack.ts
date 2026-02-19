import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useRef, useEffect } from 'react';

/**
 * A hook that provides a "safe" back navigation.
 * It first tries navigate(-1). If after a short delay the path hasn't changed
 * (meaning there was no history), it fallbacks to the provided fallback path (defaulting to home).
 */
export const useSafeBack = (fallbackPath: string = '/') => {
    const navigate = useNavigate();
    const location = useLocation();
    const navigationAttempted = useRef(false);
    const currentPathRef = useRef(location.pathname);

    // Keep path ref updated
    useEffect(() => {
        currentPathRef.current = location.pathname;
        navigationAttempted.current = false;
    }, [location.pathname]);

    const safeBack = useCallback(() => {
        const pathBefore = currentPathRef.current;

        // Try standard back
        navigate(-1);

        // Check if we actually moved
        setTimeout(() => {
            if (window.location.pathname === pathBefore && !navigationAttempted.current) {
                navigationAttempted.current = true;
                navigate(fallbackPath);
            }
        }, 100);
    }, [navigate, fallbackPath]);

    return safeBack;
};
