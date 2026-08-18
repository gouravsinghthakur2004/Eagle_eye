/**
 * Production File & Image URL Formatter for EagleEye Motorsports
 * Converts server-relative paths to full public CDN/Server URLs.
 * Ensures local device filesystem paths (file://, content://, C:\...) are never used as remote URLs.
 */

export const SERVER_BASE_URL = 'https://eagleeyeofficial.com/demo';
export const ASSETS_BASE_URL = 'https://e-pickup.randomsoftsolution.in';

/**
 * Checks if a given path is a local device path/URI
 */
export const isLocalFileUri = (path?: string | null): boolean => {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  return (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.includes(':\\') ||
    trimmed.startsWith('/data/user/') ||
    trimmed.startsWith('/var/mobile/') ||
    trimmed.startsWith('/storage/emulated/')
  );
};

/**
 * Returns a clean, displayable public URL from a server-relative path or existing URL.
 * Handles:
 * 1. Full URLs: 'https://e-pickup.randomsoftsolution.in/assets/app/profile/...' -> unchanged
 * 2. 'assets/...' relative paths: 'assets/app/profile/1756890034_d6bbc6920b98bb25b19f.jpg' -> 'https://e-pickup.randomsoftsolution.in/assets/app/profile/...'
 * 3. 'uploads/...' relative paths: 'uploads/drivers/photos/driver_1.jpg' -> 'https://eagleeyeofficial.com/demo/uploads/drivers/photos/driver_1.jpg'
 * 4. Local device paths: 'file:///...' -> unchanged for preview
 */
export const getFileUrl = (path?: string | null): string => {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed || trimmed.toUpperCase() === 'NA' || trimmed.toUpperCase() === 'NULL') return '';

  // 1. Already a full remote URL (http:// or https://)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. Local device path (valid for local file preview in Image component on device)
  if (isLocalFileUri(trimmed)) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

  // 3. Backend legacy asset path (assets/app/profile/...)
  if (cleanPath.startsWith('assets/')) {
    return `${ASSETS_BASE_URL}/${cleanPath}`;
  }

  // 4. Default server upload path (uploads/...)
  return `${SERVER_BASE_URL}/${cleanPath}`;
};

/**
 * Helper to get display avatar URL with default high-res fallback
 */
export const getUserAvatarUrl = (
  profilePicUrl?: string | null,
  profilePicPath?: string | null,
  fallback: string = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
): string => {
  const urlCandidate = profilePicUrl && profilePicUrl.trim() !== '' ? profilePicUrl : null;
  const pathCandidate = profilePicPath && profilePicPath.trim() !== '' ? profilePicPath : null;

  const target = urlCandidate || pathCandidate;
  if (!target) return fallback;

  const resolved = getFileUrl(target);
  return resolved || fallback;
};

/**
 * Extracts a clean safe filename from a file object or path
 */
export const getSafeFileName = (
  prefix: string,
  originalName?: string,
  extension: string = 'jpg'
): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  if (originalName) {
    const ext = originalName.split('.').pop()?.toLowerCase() || extension;
    const sanitizedBase = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 20);
    return `${prefix}_${sanitizedBase}_${timestamp}_${randomSuffix}.${ext}`;
  }
  return `${prefix}_${timestamp}_${randomSuffix}.${extension}`;
};
