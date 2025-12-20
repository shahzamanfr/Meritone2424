import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    loading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    threshold?: number; // Distance from bottom in pixels to trigger load
}

export const useInfiniteScroll = ({
    loading,
    hasMore,
    onLoadMore,
    threshold = 300
}: UseInfiniteScrollOptions) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && !loading && hasMore) {
            onLoadMore();
        }
    }, [loading, hasMore, onLoadMore]);

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: `${threshold}px`,
            threshold: 0.1
        };

        observerRef.current = new IntersectionObserver(handleObserver, options);

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observerRef.current.observe(currentRef);
        }

        return () => {
            if (observerRef.current && currentRef) {
                observerRef.current.unobserve(currentRef);
            }
        };
    }, [handleObserver, threshold]);

    return loadMoreRef;
};
