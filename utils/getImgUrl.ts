interface ImgOptions {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
    quality?: number;
    format?: 'origin' | 'webp' | 'avif';
}

export const getImgUrl = (path: string, options?: ImgOptions) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    if (options) {
        const params = new URLSearchParams();
        if (options.width) params.append('width', options.width.toString());
        if (options.height) params.append('height', options.height.toString());
        if (options.resize) params.append('resize', options.resize);
        if (options.quality) params.append('quality', options.quality.toString());
        if (options.format) params.append('format', options.format);

        const queryString = params.toString();
        return `/optimize/${path}?${queryString}`;
    }

    return `/image/${path}`;
};
