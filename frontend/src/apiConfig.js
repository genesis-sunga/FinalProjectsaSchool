import axios from 'axios';

const LOCAL_API_ORIGIN = 'http://localhost:5000';
const DEFAULT_API_ORIGIN = import.meta.env.PROD ? window.location.origin : LOCAL_API_ORIGIN;

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN).replace(/\/$/, '');

export const toApiUrl = (url) => {
    if (typeof url !== 'string') return url;
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith(LOCAL_API_ORIGIN)) {
        return `${API_BASE_URL}${trimmedUrl.slice(LOCAL_API_ORIGIN.length)}`;
    }

    try {
        const parsedUrl = new URL(trimmedUrl);
        if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
            return `${API_BASE_URL}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
        }
    } catch {
        // Relative URLs are handled by callers that know whether they are API or asset paths.
    }

    return trimmedUrl;
};

export const toAssetUrl = (url) => {
    if (typeof url !== 'string' || !url.trim()) return url;
    const normalizedUrl = toApiUrl(url);
    if (normalizedUrl.startsWith('/uploads/')) return `${API_BASE_URL}${normalizedUrl}`;
    if (normalizedUrl.startsWith('uploads/')) return `${API_BASE_URL}/${normalizedUrl}`;
    return normalizedUrl;
};

const imageUrlKeyPattern = /(^|_)(image_url|id_image_url|id_front_image_url|id_back_image_url|profile_image_url)$/i;

const normalizeAssetUrlsInData = (value, key = '') => {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeAssetUrlsInData(item));
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([entryKey, entryValue]) => [
                entryKey,
                normalizeAssetUrlsInData(entryValue, entryKey)
            ])
        );
    }

    if (typeof value === 'string' && imageUrlKeyPattern.test(key)) {
        return toAssetUrl(value);
    }

    return value;
};

axios.interceptors.request.use((config) => ({
    ...config,
    url: toApiUrl(config.url)
}));

axios.interceptors.response.use((response) => ({
    ...response,
    data: normalizeAssetUrlsInData(response.data)
}));

const nativeOpen = window.open.bind(window);
window.open = (url, ...args) => nativeOpen(toApiUrl(url), ...args);
