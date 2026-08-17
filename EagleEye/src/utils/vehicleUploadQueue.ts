/**
 * Production Upload Queue for Vehicle Documents & Images
 * Handles batch compression, FormData assembly, upload progress, and retries for Vehicles.
 */

import { SelectedFile } from './fileValidation';
import { fileCompression } from './fileCompression';
import { vehicleService } from '@/services/vehicleService';
import { VehicleProfile } from '@/types';

export type VehicleUploadFieldKey =
  | 'rc_upload'
  | 'insurance_doc_upload'
  | 'vehicle_img_front'
  | 'vehicle_img_back'
  | 'vehicle_img_left'
  | 'vehicle_img_right';

export interface VehicleUploadProgressStatus {
  stepName: string;
  percent: number;
  isUploading: boolean;
  error?: string;
}

const FIELD_LABELS: Record<VehicleUploadFieldKey, string> = {
  rc_upload: 'RC Document',
  insurance_doc_upload: 'Insurance Document',
  vehicle_img_front: 'Front Vehicle Image',
  vehicle_img_back: 'Back Vehicle Image',
  vehicle_img_left: 'Left Vehicle Image',
  vehicle_img_right: 'Right Vehicle Image',
};

export const vehicleUploadQueue = {
  /**
   * Process and upload vehicle files with progress reporting
   */
  processQueueAndSubmit: async (
    vehicleData: Partial<VehicleProfile>,
    files: Partial<Record<VehicleUploadFieldKey, SelectedFile>>,
    onProgress?: (status: VehicleUploadProgressStatus) => void,
    userId?: string | number
  ): Promise<{ success: boolean; data?: VehicleProfile; message?: string }> => {
    try {
      const pendingKeys = (Object.keys(files) as VehicleUploadFieldKey[]).filter(
        (key) => Boolean(files[key])
      );
      const totalSteps = pendingKeys.length + 1;
      let completedSteps = 0;

      const finalPayload: Partial<VehicleProfile> = { ...vehicleData };
      const optimizedFilesMap: Partial<Record<VehicleUploadFieldKey, SelectedFile>> = {};

      // 1. Process & Compress files
      for (const key of pendingKeys) {
        const fileObj = files[key];
        if (fileObj) {
          const label = FIELD_LABELS[key] || 'Document';

          if (onProgress) {
            const currentPercent = Math.round((completedSteps / totalSteps) * 100);
            onProgress({
              stepName: `Optimizing ${label}…`,
              percent: Math.min(currentPercent + 5, 90),
              isUploading: true,
            });
          }

          // Compress image files, leave PDF documents untouched
          const { file: optimizedFile } = await fileCompression.compressImageIfNeeded(fileObj);

          // Store optimized file object for multipart upload (NEVER local device URI string)
          optimizedFilesMap[key] = optimizedFile;

          completedSteps++;
          if (onProgress) {
            const currentPercent = Math.round((completedSteps / totalSteps) * 100);
            onProgress({
              stepName: `Uploading ${label}…`,
              percent: Math.min(currentPercent, 95),
              isUploading: true,
            });
          }
        }
      }

      // 2. Finalize submission via service with multipart files
      if (onProgress) {
        onProgress({
          stepName: 'Finalizing vehicle submission…',
          percent: 98,
          isUploading: true,
        });
      }

      const result = await vehicleService.saveVehicle(finalPayload, userId, optimizedFilesMap);

      if (onProgress) {
        onProgress({
          stepName: vehicleData.id ? 'Vehicle updated successfully!' : 'Vehicle added successfully!',
          percent: 100,
          isUploading: false,
        });
      }

      return result;
    } catch (error: any) {
      const errMsg = error?.message || 'Vehicle submission failed. Please check network connection and retry.';
      if (onProgress) {
        onProgress({
          stepName: 'Submission failed',
          percent: 0,
          isUploading: false,
          error: errMsg,
        });
      }
      throw new Error(errMsg);
    }
  },
};
