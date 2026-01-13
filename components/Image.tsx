import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getImgUrl } from '../utils/getImgUrl';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    fallback?: string;
}

export const Image: React.FC<ImageProps> = ({ src, alt, className, fallback, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const finalSrc = getImgUrl(src);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Skeleton / Loading State */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse z-10" />
            )}

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 z-10">
                    <ImageOff size={24} />
                </div>
            )}

            {/* Actual Image */}
            <img
                src={finalSrc || fallback}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                loading="lazy"
                {...props}
            />
        </div>
    );
};
