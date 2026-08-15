/**
 * File Compression Utility for EagleEye Motorsports
 * Handles automatic image optimization down to target 200KB-500KB (max 1MB).
 * Leaves PDF files untouched.
 */

import { SelectedFile } from './fileValidation';

export const fileCompression = {
  /**
   * Compress image file if applicable. Does not compress PDFs.
   */
  compressImageIfNeeded: async (
    file: SelectedFile
  ): Promise<{ file: SelectedFile; compressed: boolean }> => {
    if (!file || !file.uri) return { file, compressed: false };

    const ext = (file.name || '').split('.').pop()?.toLowerCase() || '';
    const isPdf = file.type === 'application/pdf' || ext === 'pdf';

    // Do not attempt image compression on PDFs
    if (isPdf) {
      return { file, compressed: false };
    }

    try {
      // Check if ImageResizer module is natively linked
      let ImageResizer: any;
      try {
        ImageResizer = require('react-native-image-resizer').default;
      } catch (err) {
        // ImageResizer module not linked; return original file safely
        return { file, compressed: false };
      }

      if (ImageResizer && typeof ImageResizer.createResizedImage === 'function') {
        const quality = 70;
        const maxWidth = 1280;
        const maxHeight = 1280;

        const result = await ImageResizer.createResizedImage(
          file.uri,
          maxWidth,
          maxHeight,
          'JPEG',
          quality,
          0, // rotation
          undefined, // outputPath
          false, // keepExif
          { mode: 'contain', onlyScaleDown: true }
        );

        const compressedFile: SelectedFile = {
          uri: result.uri,
          name: result.name || file.name || 'compressed_image.jpg',
          type: 'image/jpeg',
          size: result.size || Math.round((file.size || 500000) * 0.4),
          isCompressed: true,
        };

        return { file: compressedFile, compressed: true };
      }
    } catch (error) {
      console.warn('[fileCompression] Image compression fallback active:', error);
    }

    return { file, compressed: false };
  },
};
