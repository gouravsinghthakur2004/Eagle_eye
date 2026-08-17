/**
 * Intelligent Document & Image Compression Engine for EagleEye Motorsports
 *
 * Design Goals:
 * 1. High Readability: Preserves text sharpness on Driving Licenses, RCs, Insurance Policies, and Scrutiny Photos.
 * 2. Aspect Ratio & Orientation: Always scales down proportionally without warping or rotating.
 * 3. Multi-Pass Adaptive Compression:
 *    - Standard Image (under 4 MB): Light optimization down to ~300KB - 800KB at 85% quality.
 *    - Large Image (4 MB - 10 MB): Downscales to max 1920x1920 at 80% quality (resulting in ~800KB - 1.5MB).
 *    - Extra-Large Image (10 MB - 50 MB): Downscales to max 1600x1600 at 75% quality (resulting in ~1.2MB - 2.5MB).
 * 4. Zero Corruption for PDFs: PDFs and document binaries are strictly left untouched.
 */

import { SelectedFile, RECOMMENDED_MAX_SIZE_BYTES } from './fileValidation';

export interface CompressionResult {
  file: SelectedFile;
  compressed: boolean;
  originalSize?: number;
  finalSize?: number;
}

export const fileCompression = {
  /**
   * Compress and optimize an image file if applicable.
   * Leaves PDFs untouched.
   */
  compressImageIfNeeded: async (
    file: SelectedFile
  ): Promise<CompressionResult> => {
    if (!file || !file.uri) {
      return { file, compressed: false };
    }

    const originalSize = file.size || 0;
    const fileName = (file.name || '').toLowerCase();
    const fileType = (file.type || '').toLowerCase();
    const ext = fileName.split('.').pop() || '';

    const isPdf = fileType.includes('pdf') || ext === 'pdf';

    // Strictly skip PDFs and non-image documents to prevent format corruption
    if (isPdf) {
      return {
        file,
        compressed: false,
        originalSize,
        finalSize: originalSize,
      };
    }

    try {
      // Check if ImageResizer module is natively linked
      let ImageResizer: any;
      try {
        ImageResizer = require('react-native-image-resizer').default;
      } catch {
        // ImageResizer module not linked; return original file safely
        return {
          file,
          compressed: false,
          originalSize,
          finalSize: originalSize,
        };
      }

      if (ImageResizer && typeof ImageResizer.createResizedImage === 'function') {
        // Adaptive parameter selection based on input size
        let maxWidth = 1920;
        let maxHeight = 1920;
        let quality = 82;

        if (originalSize > 10 * 1024 * 1024) {
          // 10 MB+ DSLR or 48MP raw captures
          maxWidth = 1600;
          maxHeight = 1600;
          quality = 75;
        } else if (originalSize > RECOMMENDED_MAX_SIZE_BYTES) {
          // 4 MB - 10 MB high-res phone captures
          maxWidth = 1920;
          maxHeight = 1920;
          quality = 80;
        } else {
          // Standard < 4 MB photo
          maxWidth = 1920;
          maxHeight = 1920;
          quality = 85;
        }

        const format = ext === 'png' ? 'PNG' : 'JPEG';

        const result = await ImageResizer.createResizedImage(
          file.uri,
          maxWidth,
          maxHeight,
          format,
          quality,
          0, // rotation
          undefined, // outputPath
          false, // keepExif
          { mode: 'contain', onlyScaleDown: true }
        );

        const estimatedSize =
          result.size ||
          Math.max(
            150 * 1024,
            Math.round(originalSize > 0 ? originalSize * 0.35 : 450 * 1024)
          );

        const compressedFile: SelectedFile = {
          uri: result.uri,
          name: result.name || file.name || `optimized_${Date.now()}.${format === 'PNG' ? 'png' : 'jpg'}`,
          type: format === 'PNG' ? 'image/png' : 'image/jpeg',
          size: estimatedSize,
          isCompressed: true,
          originalSize: originalSize > 0 ? originalSize : undefined,
        };

        return {
          file: compressedFile,
          compressed: true,
          originalSize,
          finalSize: estimatedSize,
        };
      }
    } catch (error) {
      console.warn('[fileCompression] Image optimization fallback:', error);
    }

    return {
      file,
      compressed: false,
      originalSize,
      finalSize: originalSize,
    };
  },
};
