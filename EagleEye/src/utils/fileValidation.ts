/**
 * File Validation Utility for EagleEye Motorsports Document Uploads
 */

export interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number; // Size in bytes
  isCompressed?: boolean;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const fileValidation = {
  validateFile: (file: SelectedFile): { valid: boolean; error?: string } => {
    if (!file || !file.uri) {
      return { valid: false, error: 'No file selected.' };
    }

    const fileName = (file.name || '').toLowerCase();
    const fileType = (file.type || '').toLowerCase();
    const ext = fileName.split('.').pop() || '';

    // Check Extension & Type
    const isImage = ALLOWED_IMAGE_TYPES.includes(fileType) || ['jpg', 'jpeg', 'png'].includes(ext);
    const isPdf = ALLOWED_PDF_TYPES.includes(fileType) || ext === 'pdf';

    if (!isImage && !isPdf && !ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: 'Only JPG, PNG, and PDF files are allowed.',
      };
    }

    // Check File Size
    if (file.size && file.size > 0) {
      if (isPdf && file.size > MAX_PDF_SIZE_BYTES) {
        return {
          valid: false,
          error: 'Please upload a PDF smaller than 5 MB.',
        };
      }

      if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
        return {
          valid: false,
          error: 'Image size must be smaller than 10 MB.',
        };
      }
    }

    return { valid: true };
  },

  formatFileSize: (sizeInBytes?: number): string => {
    if (!sizeInBytes || sizeInBytes <= 0) return '0 KB';
    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    }
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  },
};
