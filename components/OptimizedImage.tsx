import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className = "", ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Skeleton / Placeholder */}
            {!isLoaded && !error && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse z-10" />
            )}

            {/* Actual Image */}
            <img
                src={src}
                alt={alt}
                className={`transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    setError(true);
                    setIsLoaded(true); // Stop skeleton on error
                }}
                loading="lazy"
                {...props}
            />
        </div>
    );
};
