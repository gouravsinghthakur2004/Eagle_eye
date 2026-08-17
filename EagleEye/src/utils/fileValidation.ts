/**
 * Comprehensive File Validation & Size Recommendation Engine for EagleEye Motorsports
 *
 * Rules:
 * 1. Generous Picker Ceiling (50 MB) allows users to select high-res photos (10-20 MB)
 *    and multi-page PDF scans without getting blocked at the picker level.
 * 2. Standardized recommendation label: "Recommended: up to 4 MB".
 * 3. Secure Allowlist: JPG, JPEG, PNG, WEBP, HEIC, HEIF, PDF.
 * 4. Strict Blocklist: Rejects dangerous executable binaries (exe, apk, sh, bat, php, etc.).
 */

export interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number; // Size in bytes
  isCompressed?: boolean;
  originalSize?: number;
}

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export const ALLOWED_PDF_MIME_TYPES = [
  'application/pdf',
];

export const ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'heif',
  'pdf',
];

export const DANGEROUS_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'sh',
  'apk',
  'msi',
  'js',
  'vbs',
  'php',
  'py',
  'jar',
  'bin',
  'dll',
  'com',
  'scr',
  'pif',
  'app',
];

export const RECOMMENDED_SIZE_LABEL = 'Recommended: up to 4 MB';
export const RECOMMENDED_MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB target
export const PICKER_SAFETY_CEILING_BYTES = 50 * 1024 * 1024; // 50 MB picker ceiling
export const SERVER_MAX_PAYLOAD_BYTES = 25 * 1024 * 1024; // 25 MB max upload ceiling

export const fileValidation = {
  RECOMMENDED_SIZE_LABEL,

  /**
   * Validates file format and basic safety upon selection in the picker.
   * Does NOT reject files between 4 MB and 50 MB; these are marked for optimization.
   */
  validateFile: (file: SelectedFile): { valid: boolean; error?: string; needsCompression?: boolean } => {
    if (!file || !file.uri) {
      return { valid: false, error: 'No file selected.' };
    }

    const fileName = (file.name || '').toLowerCase();
    const fileType = (file.type || '').toLowerCase();
    const ext = fileName.split('.').pop() || '';

    // 1. Strict Security Blocklist
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Files with extension .${ext} are executable and not permitted for security reasons.`,
      };
    }

    // 2. Allowlist Check
    const isImage =
      ALLOWED_IMAGE_MIME_TYPES.some((m) => fileType.includes(m)) ||
      ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext);
    const isPdf =
      ALLOWED_PDF_MIME_TYPES.some((m) => fileType.includes(m)) || ext === 'pdf';

    if (!isImage && !isPdf && !ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: 'Unsupported file format. Please select a JPG, PNG, WEBP, or PDF file.',
      };
    }

    // 3. Size Ceiling Check (Generous 50 MB limit to avoid picker crashes)
    if (file.size && file.size > PICKER_SAFETY_CEILING_BYTES) {
      return {
        valid: false,
        error: `Selected file is excessively large (${fileValidation.formatFileSize(
          file.size
        )}). Please select a file under 50 MB.`,
      };
    }

    // Flag for background optimization if larger than recommended 4 MB target
    const needsCompression = Boolean(
      isImage && file.size && file.size > RECOMMENDED_MAX_SIZE_BYTES
    );

    return { valid: true, needsCompression };
  },

  /**
   * Validates final file before sending to API (post-compression check)
   */
  validatePostOptimization: (file: SelectedFile): { valid: boolean; error?: string } => {
    if (!file || !file.uri) {
      return { valid: false, error: 'File is missing.' };
    }
    if (file.size && file.size > SERVER_MAX_PAYLOAD_BYTES) {
      return {
        valid: false,
        error: `File size (${fileValidation.formatFileSize(
          file.size
        )}) exceeds server upload limit (${fileValidation.formatFileSize(SERVER_MAX_PAYLOAD_BYTES)}).`,
      };
    }
    return { valid: true };
  },

  /**
   * Helper to format file sizes nicely in UI
   */
  formatFileSize: (sizeInBytes?: number): string => {
    if (!sizeInBytes || sizeInBytes <= 0) return '0 KB';
    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    }
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  },
};
