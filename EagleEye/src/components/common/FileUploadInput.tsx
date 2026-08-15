import React, { useState, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { fileValidation, SelectedFile } from '@/utils/fileValidation';
import { fileCompression } from '@/utils/fileCompression';

interface FileUploadInputProps {
  label: string;
  value?: string;
  onFileSelected: (fileObj: SelectedFile | null) => void;
  allowedTypes?: ('image' | 'pdf')[];
  maxSizeMB?: number;
  icon?: string;
  required?: boolean;
}

const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'EagleEye requires camera access to capture document and profile photos.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[Permissions] Camera permission error:', err);
    return false;
  }
};

export const FileUploadInputComponent: React.FC<FileUploadInputProps> = ({
  label,
  value,
  onFileSelected,
  allowedTypes = ['image', 'pdf'],
  maxSizeMB = 5,
  icon = '📎',
  required = false,
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if initial value string (URL or URI) exists
  React.useEffect(() => {
    if (value) {
      if (value.startsWith('http') || value.startsWith('file:') || value.startsWith('content:')) {
        const ext = value.split('.').pop()?.split('?')[0].toLowerCase() || 'jpg';
        const isPdf = ext === 'pdf';
        setSelectedFile({
          uri: value,
          name: value.split('/').pop()?.split('?')[0] || `${label.toLowerCase().replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'jpg'}`,
          type: isPdf ? 'application/pdf' : 'image/jpeg',
          size: isPdf ? 1.2 * 1024 * 1024 : 350 * 1024,
        });
      }
    } else if (!value && selectedFile) {
      setSelectedFile(null);
    }
  }, [value]);

  const handleProcessSelectedFile = async (rawFile: SelectedFile) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // 1. Validate file format and original size limits
      const validation = fileValidation.validateFile(rawFile);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid file.');
        Alert.alert('Validation Error', validation.error || 'Selected file is invalid.');
        setIsProcessing(false);
        return;
      }

      // 2. Compress image if needed (leaves PDF untouched)
      const { file: processedFile } = await fileCompression.compressImageIfNeeded(rawFile);

      setSelectedFile(processedFile);
      onFileSelected(processedFile);
      setModalVisible(false);
    } catch (err: any) {
      console.warn('[FileUploadInput] Processing error:', err);
      setErrorMessage('Failed to process selected file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Launch Real Camera with Android permission checking
  const handleLaunchCamera = async () => {
    setModalVisible(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
      return;
    }

    launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, (res) => {
      if (res.didCancel || res.errorCode) {
        if (res.errorMessage) console.warn('[Camera] Launch error:', res.errorMessage);
        return;
      }
      const asset = res.assets?.[0];
      if (asset && asset.uri) {
        handleProcessSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 500000,
        });
      }
    });
  };

  // Launch Real Photo Gallery
  const handleLaunchGallery = () => {
    setModalVisible(false);
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (res.didCancel || res.errorCode) {
        if (res.errorMessage) console.warn('[Gallery] Launch error:', res.errorMessage);
        return;
      }
      const asset = res.assets?.[0];
      if (asset && asset.uri) {
        handleProcessSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `gallery_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 500000,
        });
      }
    });
  };

  // Launch Native Document & File Picker (PDF / Files / Drive)
  const handleLaunchDocumentPicker = async () => {
    setModalVisible(false);
    try {
      let DocumentPicker: any;
      try {
        DocumentPicker = require('react-native-document-picker').default;
      } catch (e) {}

      if (DocumentPicker && typeof DocumentPicker.pickSingle === 'function') {
        const res = await DocumentPicker.pickSingle({
          type: [DocumentPicker.types.pdf, DocumentPicker.types.images, DocumentPicker.types.allFiles],
        });
        if (res && res.uri) {
          handleProcessSelectedFile({
            uri: res.uri,
            name: res.name || `document_${Date.now()}.${res.type?.includes('pdf') ? 'pdf' : 'jpg'}`,
            type: res.type || 'application/pdf',
            size: res.size || 500000,
          });
          return;
        }
      }
    } catch (err: any) {
      if (err && err.message && !err.message.includes('cancel')) {
        console.warn('[DocumentPicker] Native picker error:', err);
      }
    }

    // Launch Native Media & File selector allowing document & image selection from Downloads / Internal Storage / Drive
    launchImageLibrary({ mediaType: 'mixed', selectionLimit: 1 }, (res) => {
      if (res.didCancel || res.errorCode) return;
      const asset = res.assets?.[0];
      if (asset && asset.uri) {
        const isPdfAsset = asset.type?.includes('pdf') || asset.fileName?.toLowerCase().endsWith('.pdf');
        handleProcessSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `document_${Date.now()}.${isPdfAsset ? 'pdf' : 'jpg'}`,
          type: asset.type || (isPdfAsset ? 'application/pdf' : 'image/jpeg'),
          size: asset.fileSize || 500000,
        });
      }
    });
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    onFileSelected(null);
  };

  const isPdf = selectedFile?.type?.includes('pdf') || selectedFile?.name.toLowerCase().endsWith('.pdf');

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </View>

      {selectedFile ? (
        /* Selected File Dark Card Preview */
        <View style={styles.fileCard}>
          <View style={styles.fileCardHeader}>
            {!isPdf && selectedFile.uri ? (
              <Image source={{ uri: selectedFile.uri }} style={styles.thumbnailPreview} resizeMode="cover" />
            ) : (
              <View style={styles.pdfIconBadge}>
                <Text style={styles.pdfIconText}>📄 PDF</Text>
              </View>
            )}

            <View style={styles.fileMeta}>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={styles.fileSizeText}>
                {fileValidation.formatFileSize(selectedFile.size)}
                {selectedFile.isCompressed ? ' • Optimized (JPEG)' : ''}
              </Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Selected & Verified</Text>
              </View>
            </View>
          </View>

          <View style={styles.fileActionsRow}>
            <TouchableOpacity style={styles.replaceBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.replaceBtnText}>🔄 Replace</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
              <Text style={styles.removeBtnText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Empty Upload Dashed Card */
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.uploadBox}
          onPress={() => setModalVisible(true)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FF7A00" style={{ marginRight: 12 }} />
          ) : (
            <Text style={styles.uploadIcon}>{icon}</Text>
          )}

          <View style={styles.uploadTextGroup}>
            <Text style={styles.uploadTitle}>
              {isProcessing ? 'Optimizing file…' : `Upload ${label}`}
            </Text>
            <Text style={styles.uploadSubtitle}>JPG, PNG or PDF • Max {maxSizeMB} MB</Text>
          </View>

          <View style={styles.browseBtn}>
            <Text style={styles.browseBtnText}>Upload</Text>
          </View>
        </TouchableOpacity>
      )}

      {errorMessage && <Text style={styles.errorText}>⚠️ {errorMessage}</Text>}

      {/* File Picker Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Choose upload source (JPG, PNG, or PDF up to {maxSizeMB}MB):</Text>

            {/* Camera Option */}
            <TouchableOpacity style={styles.optionRow} onPress={handleLaunchCamera}>
              <Text style={styles.optionIcon}>📷</Text>
              <View style={styles.optionMeta}>
                <Text style={styles.optionTitle}>Take Photo (Camera)</Text>
                <Text style={styles.optionSub}>Capture photo using device camera</Text>
              </View>
            </TouchableOpacity>

            {/* Photo Gallery Option */}
            <TouchableOpacity style={styles.optionRow} onPress={handleLaunchGallery}>
              <Text style={styles.optionIcon}>🖼️</Text>
              <View style={styles.optionMeta}>
                <Text style={styles.optionTitle}>Photo Gallery</Text>
                <Text style={styles.optionSub}>Select image from photo library</Text>
              </View>
            </TouchableOpacity>

            {/* Document Picker Option */}
            <TouchableOpacity style={styles.optionRow} onPress={handleLaunchDocumentPicker}>
              <Text style={styles.optionIcon}>📁</Text>
              <View style={styles.optionMeta}>
                <Text style={styles.optionTitle}>Document File (PDF / Files)</Text>
                <Text style={styles.optionSub}>Select PDF or file from device storage</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const FileUploadInput = memo(FileUploadInputComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  requiredAsterisk: {
    color: '#FF7A00',
    fontWeight: 'bold',
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF7A00',
    borderStyle: 'dashed',
    padding: 14,
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadTextGroup: {
    flex: 1,
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  browseBtn: {
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF7A00',
  },
  browseBtnText: {
    color: '#FF7A00',
    fontSize: 12,
    fontWeight: '800',
  },
  fileCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    padding: 12,
  },
  fileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  thumbnailPreview: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  pdfIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfIconText: {
    color: '#FF7A00',
    fontSize: 11,
    fontWeight: '800',
  },
  fileMeta: {
    flex: 1,
  },
  fileNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fileSizeText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  fileActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingTop: 10,
  },
  replaceBtn: {
    flex: 1,
    backgroundColor: '#FF7A00',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  replaceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  removeBtn: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeIcon: {
    color: '#9CA3AF',
    fontSize: 20,
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionMeta: {
    flex: 1,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  optionSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  closeModalBtn: {
    backgroundColor: '#1F1F1F',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
