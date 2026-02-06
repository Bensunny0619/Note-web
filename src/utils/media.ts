import API_CONFIG from '../services/config';

/**
 * Resolves a media URL from the backend.
 * If the URL is already absolute (starts with http or data:), it's returned as is.
 * Otherwise, it's prefixed with the backend's base URL (removing /api if present).
 */
export const resolveMediaUrl = (url: string | null | undefined): string => {
    if (!url) return '';

    // Skip resolution for React Native/Web local protocols
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;

    const rootUrl = API_CONFIG.BASE_URL.replace(/\/api$/, '');

    // Host Normalization: If it's an absolute URL, check if the host matches the current rootUrl.
    // If it doesn't match (e.g. stale IP 192.168.0.4 vs 192.168.0.2), rewrite it.
    if (url.startsWith('http')) {
        try {
            const mediaUrlObj = new URL(url);
            const currentRootUrlObj = new URL(rootUrl);

            // If hostname or port mismatch (ignoring local vs remote)
            if (mediaUrlObj.host !== currentRootUrlObj.host) {
                // Rewrite the URL to use current root host while keeping the path
                return `${rootUrl}${mediaUrlObj.pathname}${mediaUrlObj.search}`;
            }
            return url;
        } catch (e) {
            return url; // Fallback if URL parsing fails
        }
    }

    // Ensure the relative url starts with a slash
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${rootUrl}${normalizedUrl}`;
};
