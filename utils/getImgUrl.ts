export const getImgUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `https://bxklsejtopzevituoaxk.supabase.co/storage/v1/object/public/${path}`;
};
