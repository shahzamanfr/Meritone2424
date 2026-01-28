import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
    images: string[];
    renderMedia: (url: string, index: number) => React.ReactNode;
}

export const ImageCarouselComponent: React.FC<ImageCarouselProps> = ({ images, renderMedia }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    if (images.length === 0) return null;

    if (images.length === 1) {
        return (
            <div className="relative overflow-hidden rounded-lg max-h-[500px]">
                {renderMedia(images[0], 0)}
            </div>
        );
    }

    return (
        <div className="relative group">
            {/* Main Image Container */}
            <div className="relative overflow-hidden rounded-lg max-h-[500px] bg-black">
                {renderMedia(images[currentIndex], currentIndex)}
            </div>

            {/* Previous Button */}
            <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Previous image"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Button */}
            <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Next image"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentIndex(index);
                        }}
                        className={`rounded-full transition-all duration-300 ${index === currentIndex
                            ? 'bg-white !w-2 !h-2 shadow-sm scale-110'
                            : 'bg-white/50 !w-2 !h-2 hover:bg-white/80'
                            }`}
                        style={{ width: '8px', height: '8px', minWidth: '8px', minHeight: '8px' }}
                        aria-label={`Go to image ${index + 1}`}
                    />
                ))}
            </div>

            {/* Image Counter */}
            <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    );
};
