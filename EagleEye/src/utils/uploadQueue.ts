/**
 * Production Upload Queue for EagleEye Motorsports
 * Handles batch compression, FormData assembly, upload progress, and retries for:
 * - Driver Profiles (driver_pic_upload, dl_upload, insurance_document)
 * - Navigator Profiles (driver_pic_upload, dl_upload, insurance_document)
 * - Vehicle Profiles (rc_upload, insurance_doc_upload, vehicle_img_front, vehicle_img_back, vehicle_img_left, vehicle_img_right, fitness_upload)
 */

import { SelectedFile } from './fileValidation';
import { fileCompression } from './fileCompression';
import { driverNavigatorService } from '@/services/driverNavigatorService';
import { vehicleService } from '@/services/vehicleService';
import { DriverNavigatorProfile, VehicleProfile } from '@/types';

export interface UploadProgressStatus {
  stepName: string;
  percent: number;
  isUploading: boolean;
  error?: string;
}

export const uploadQueue = {
  /**
   * Process and upload Driver / Navigator files via multipart/form-data with progress reporting
   */
  processDriverQueueAndSubmit: async (
    profileData: Partial<DriverNavigatorProfile>,
    files: Partial<Record<'driver_pic_upload' | 'dl_upload' | 'insurance_document', SelectedFile>>,
    onProgress?: (status: UploadProgressStatus) => void,
    userId?: string | number
  ): Promise<{ success: boolean; data?: DriverNavigatorProfile; message?: string }> => {
    try {
      const pendingKeys = Object.keys(files) as Array<'driver_pic_upload' | 'dl_upload' | 'insurance_document'>;
      const totalSteps = pendingKeys.length + 1;
      let completedSteps = 0;

      const finalPayload: Partial<DriverNavigatorProfile> = { ...profileData };
      const optimizedFilesMap: Partial<Record<'driver_pic_upload' | 'dl_upload' | 'insurance_document', SelectedFile>> = {};

      // 1. Process & Compress files
      for (const key of pendingKeys) {
        const fileObj = files[key];
        if (fileObj) {
          const label =
            key === 'driver_pic_upload'
              ? 'Profile photo'
              : key === 'dl_upload'
              ? 'Driving License'
              : 'Insurance document';

          if (onProgress) {
            const currentPercent = Math.round((completedSteps / totalSteps) * 100);
            onProgress({
              stepName: `Optimizing ${label}…`,
              percent: Math.min(currentPercent + 10, 90),
              isUploading: true,
            });
          }

          // Compress image files
          const { file: optimizedFile } = await fileCompression.compressImageIfNeeded(fileObj);
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
          stepName: 'Finalizing profile submission…',
          percent: 98,
          isUploading: true,
        });
      }

      const result = await driverNavigatorService.saveProfile(finalPayload, userId, optimizedFilesMap);

      if (onProgress) {
        onProgress({
          stepName: 'Profile updated successfully!',
          percent: 100,
          isUploading: false,
        });
      }

      return result;
    } catch (error: any) {
      const errMsg = error?.message || 'Upload failed. Please check network connection and retry.';
      if (onProgress) {
        onProgress({
          stepName: 'Upload failed',
          percent: 0,
          isUploading: false,
          error: errMsg,
        });
      }
      throw new Error(errMsg);
    }
  },

  /**
   * Process and upload Vehicle files via multipart/form-data with progress reporting
   */
  processVehicleQueueAndSubmit: async (
    vehicleData: Partial<VehicleProfile>,
    files: Partial<Record<string, SelectedFile>>,
    onProgress?: (status: UploadProgressStatus) => void,
    userId?: string | number
  ): Promise<{ success: boolean; data?: VehicleProfile; message?: string }> => {
    try {
      const pendingKeys = Object.keys(files);
      const totalSteps = pendingKeys.length + 1;
      let completedSteps = 0;

      const finalPayload: Partial<VehicleProfile> = { ...vehicleData };
      const optimizedFilesMap: Record<string, SelectedFile> = {};

      for (const key of pendingKeys) {
        const fileObj = files[key];
        if (fileObj) {
          if (onProgress) {
            const currentPercent = Math.round((completedSteps / totalSteps) * 100);
            onProgress({
              stepName: `Optimizing ${key.replace(/_/g, ' ')}…`,
              percent: Math.min(currentPercent + 10, 90),
              isUploading: true,
            });
          }

          const { file: optimizedFile } = await fileCompression.compressImageIfNeeded(fileObj);
          optimizedFilesMap[key] = optimizedFile;

          completedSteps++;
          if (onProgress) {
            const currentPercent = Math.round((completedSteps / totalSteps) * 100);
            onProgress({
              stepName: `Uploading ${key.replace(/_/g, ' ')}…`,
              percent: Math.min(currentPercent, 95),
              isUploading: true,
            });
          }
        }
      }

      if (onProgress) {
        onProgress({
          stepName: 'Saving vehicle registration…',
          percent: 98,
          isUploading: true,
        });
      }

      const result = await vehicleService.saveVehicle(finalPayload, userId, optimizedFilesMap);

      if (onProgress) {
        onProgress({
          stepName: 'Vehicle saved successfully!',
          percent: 100,
          isUploading: false,
        });
      }

      return result;
    } catch (error: any) {
      const errMsg = error?.message || 'Vehicle upload failed. Please try again.';
      if (onProgress) {
        onProgress({
          stepName: 'Upload failed',
          percent: 0,
          isUploading: false,
          error: errMsg,
        });
      }
      throw new Error(errMsg);
    }
  },
};
