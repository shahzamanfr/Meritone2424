// Add lazy loading to all images for better performance
export const addLazyLoadingToImages = () => {
    if (typeof window !== 'undefined') {
        // Add loading="lazy" to all images
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.setAttribute('loading', 'lazy');
        });
    }
};

// Call this in your main App component or useEffect
