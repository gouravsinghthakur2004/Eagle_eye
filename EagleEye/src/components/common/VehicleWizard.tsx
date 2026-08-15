import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '@/theme/colors';
import { useAppNavigation } from '@/context/NavigationContext';
import { VehicleProfile } from '@/types';
import { SelectedFile, fileValidation } from '@/utils/fileValidation';
import { vehicleUploadQueue, VehicleUploadFieldKey, VehicleUploadProgressStatus } from '@/utils/vehicleUploadQueue';
import { vehicleService } from '@/services/vehicleService';
import { fileCompression } from '@/utils/fileCompression';
import { validateRcNumber, validateName } from '@/utils/formValidation';
import { FormErrorBanner } from './FormErrorBanner';

interface VehicleEntry extends Partial<VehicleProfile> {
  tempId: string;
}

interface VehicleWizardProps {
  initialVehicles?: VehicleProfile[];
  initialVehicle?: VehicleProfile | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TOTAL_STEPS = 6;

const getDraftStorageKey = (userId?: string | number) => {
  if (!userId) return '@eagleeye_vehicle_draft_guest';
  return `@eagleeye_vehicle_draft_${userId}`;
};

const createEmptyVehicle = (index: number): VehicleEntry => ({
  tempId: `vehicle_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`,
  vehicle_rc_no: '',
  vehicle_owner_name: '',
  vehicle_nick_name: '',
  vehicle_manufacturing: '',
  vehicle_model: '',
  vehicle_cc: '',
  is_turbo: 'No',
  fuel_type: 'Petrol',
  drive_type: 'RWD',
  rc_upload: '',
  rc_validity: '',
  insurance_no: '',
  insurance_validity: '',
  insurance_company: '',
  insurance_doc_upload: '',
  vehicle_img_front: '',
  vehicle_img_back: '',
  vehicle_img_left: '',
  vehicle_img_right: '',
  vehicle_additional_info: '',
  status: 1,
});

export const VehicleWizard: React.FC<VehicleWizardProps> = ({
  initialVehicles,
  initialVehicle,
  onSuccess,
  onCancel,
}) => {
  const { user, selectVehicleForJoin } = useAppNavigation();
  const userId = user?.id;
  const draftKey = getDraftStorageKey(userId);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftRestored, setDraftRestored] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    Keyboard.dismiss();
    setFormErrors([]);
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Dynamic Multi-Entry Vehicles Array State
  const [vehicles, setVehicles] = useState<VehicleEntry[]>(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      return initialVehicles.map((v, i) => ({
        ...v,
        tempId: v.id ? String(v.id) : `vehicle_init_${i}`,
      }));
    }
    if (initialVehicle) {
      return [{ ...initialVehicle, tempId: initialVehicle.id ? String(initialVehicle.id) : 'vehicle_init_0' }];
    }
    return [createEmptyVehicle(0)];
  });

  // Selected Files Map keyed by `${tempId}_${fieldKey}`
  const [selectedFiles, setSelectedFiles] = useState<Record<string, SelectedFile>>({});

  // Active Upload Field Picker State
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    tempId: string;
    field: VehicleUploadFieldKey;
  } | null>(null);

  // Upload Progress & Loading State
  const [uploadStatus, setUploadStatus] = useState<VehicleUploadProgressStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load Draft on Mount if no initialVehicles
  useEffect(() => {
    if (!initialVehicle && (!initialVehicles || initialVehicles.length === 0)) {
      AsyncStorage.getItem(draftKey)
        .then((stored) => {
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.vehicles && Array.isArray(parsed.vehicles)) {
                setVehicles(parsed.vehicles);
                if (parsed.currentStep) setCurrentStep(parsed.currentStep);
                setDraftRestored(true);
              }
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  }, [draftKey, initialVehicle, initialVehicles]);

  // Update field for a specific vehicle index
  const updateVehicleField = (index: number, field: keyof VehicleProfile, val: any) => {
    setVehicles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (!initialVehicle && (!initialVehicles || initialVehicles.length === 0)) {
        AsyncStorage.setItem(
          draftKey,
          JSON.stringify({ vehicles: copy, currentStep })
        ).catch(() => {});
      }
      return copy;
    });
  };

  const addVehicle = () => {
    setVehicles((prev) => [...prev, createEmptyVehicle(prev.length)]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one vehicle entry must be maintained.');
      return;
    }
    Alert.alert('Remove Vehicle', `Are you sure you want to remove Vehicle #${index + 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setVehicles((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const clearDraft = async () => {
    await AsyncStorage.removeItem(draftKey);
    setVehicles([createEmptyVehicle(0)]);
    setSelectedFiles({});
    setDraftRestored(false);
    setCurrentStep(1);
    Alert.alert('Draft Cleared', 'Your saved draft form has been reset.');
  };

  // Open Document / File Picker Options
  const openFilePickerForField = (tempId: string, field: VehicleUploadFieldKey) => {
    setActiveUploadTarget({ tempId, field });
    setPickerModalVisible(true);
  };

  const handlePickCamera = async () => {
    setPickerModalVisible(false);
    if (!activeUploadTarget) return;
    const { tempId, field } = activeUploadTarget;
    const vIndex = vehicles.findIndex((v) => v.tempId === tempId);
    if (vIndex < 0) return;

    try {
      const res = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (res.assets && res.assets[0] && res.assets[0].uri) {
        const asset = res.assets[0];
        const fileObj: SelectedFile = {
          uri: asset.uri!,
          name: asset.fileName || `${field}_camera.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize,
        };

        const validation = fileValidation.validateFile(fileObj);
        if (!validation.valid) {
          Alert.alert('Invalid Image', validation.error);
          return;
        }

        const fileKey = `${tempId}_${field}`;
        setSelectedFiles((prev) => ({ ...prev, [fileKey]: fileObj }));
        updateVehicleField(vIndex, field as keyof VehicleProfile, fileObj.uri);
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  const handlePickGallery = async () => {
    setPickerModalVisible(false);
    if (!activeUploadTarget) return;
    const { tempId, field } = activeUploadTarget;
    const vIndex = vehicles.findIndex((v) => v.tempId === tempId);
    if (vIndex < 0) return;

    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (res.assets && res.assets[0] && res.assets[0].uri) {
        const asset = res.assets[0];
        const fileObj: SelectedFile = {
          uri: asset.uri!,
          name: asset.fileName || `${field}_gallery.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize,
        };

        const validation = fileValidation.validateFile(fileObj);
        if (!validation.valid) {
          Alert.alert('Invalid Image', validation.error);
          return;
        }

        const fileKey = `${tempId}_${field}`;
        setSelectedFiles((prev) => ({ ...prev, [fileKey]: fileObj }));
        updateVehicleField(vIndex, field as keyof VehicleProfile, fileObj.uri);
      }
    } catch (err) {
      console.warn('Gallery error:', err);
    }
  };

  const handlePickDocument = async () => {
    setPickerModalVisible(false);
    if (!activeUploadTarget) return;
    const { tempId, field } = activeUploadTarget;
    const vIndex = vehicles.findIndex((v) => v.tempId === tempId);
    if (vIndex < 0) return;

    try {
      let DocumentPickerModule: any;
      try {
        DocumentPickerModule = require('react-native-document-picker').default;
      } catch (e) {}

      if (DocumentPickerModule && typeof DocumentPickerModule.pickSingle === 'function') {
        const res = await DocumentPickerModule.pickSingle({
          type: [DocumentPickerModule.types.pdf, DocumentPickerModule.types.images],
        });

        if (res && res.uri) {
          const fileObj: SelectedFile = {
            uri: res.uri,
            name: res.name || `${field}_doc.pdf`,
            type: res.type || 'application/pdf',
            size: res.size || undefined,
          };

          const validation = fileValidation.validateFile(fileObj);
          if (!validation.valid) {
            Alert.alert('Invalid Document', validation.error);
            return;
          }

          const fileKey = `${tempId}_${field}`;
          setSelectedFiles((prev) => ({ ...prev, [fileKey]: fileObj }));
          updateVehicleField(vIndex, field as keyof VehicleProfile, fileObj.uri);
          return;
        }
      }
    } catch (err: any) {
      if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.warn('Document Picker error:', err);
      }
    }

    const demoFile: SelectedFile = {
      uri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      name: `${field}_document.pdf`,
      type: 'application/pdf',
      size: 1.5 * 1024 * 1024,
    };
    const fileKey = `${tempId}_${field}`;
    setSelectedFiles((prev) => ({ ...prev, [fileKey]: demoFile }));
    updateVehicleField(vIndex, field as keyof VehicleProfile, demoFile.uri);
  };

  // Step Validation for all entries
  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    if (step === 1) {
      for (let i = 0; i < vehicles.length; i++) {
        const rcVal = validateRcNumber(vehicles[i].vehicle_rc_no || '');
        if (!rcVal.isValid) {
          errors.push(`Vehicle #${i + 1}: ${rcVal.error || 'RC Number is required.'}`);
        }
        if (vehicles[i].vehicle_owner_name) {
          const ownerVal = validateName(vehicles[i].vehicle_owner_name || '', 'Vehicle Owner Name');
          if (!ownerVal.isValid) {
            errors.push(`Vehicle #${i + 1}: ${ownerVal.error || 'Invalid Owner Name.'}`);
          }
        }
      }
    } else if (step === 2) {
      for (let i = 0; i < vehicles.length; i++) {
        if (!vehicles[i].vehicle_manufacturing?.trim()) {
          errors.push(`Vehicle #${i + 1}: Please enter Manufacturer.`);
        }
        if (!vehicles[i].vehicle_model?.trim()) {
          errors.push(`Vehicle #${i + 1}: Please enter Model.`);
        }
      }
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }

    setFormErrors([]);
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Submit: process uploads and submit vehicles[]
  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    try {
      setIsSubmitting(true);
      setUploadStatus({
        stepName: 'Optimizing vehicle images & documents…',
        percent: 10,
        isUploading: true,
      });

      const processedVehicles = await Promise.all(
        vehicles.map(async (v) => {
          const vCopy = { ...v };
          const keys: VehicleUploadFieldKey[] = [
            'rc_upload',
            'insurance_doc_upload',
            'vehicle_img_front',
            'vehicle_img_back',
            'vehicle_img_left',
            'vehicle_img_right',
          ];

          for (const key of keys) {
            const fileKey = `${v.tempId}_${key}`;
            const fileObj = selectedFiles[fileKey];
            if (fileObj) {
              const { file: optimizedFile } = await fileCompression.compressImageIfNeeded(fileObj);
              vCopy[key] = optimizedFile.uri;
            }
          }
          return vCopy;
        })
      );

      setUploadStatus({
        stepName: 'Submitting vehicles telemetry…',
        percent: 85,
        isUploading: true,
      });

      const res = await vehicleService.saveMultipleVehicles(processedVehicles, userId);
      setIsSubmitting(false);

      if (res.success) {
        if (processedVehicles && processedVehicles.length > 0) {
          selectVehicleForJoin(processedVehicles[0]);
        }
        await AsyncStorage.removeItem(draftKey);
        Alert.alert('Success', res.message || 'Vehicle profiles saved successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) onSuccess();
            },
          },
        ]);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      console.warn('Vehicle Submit error:', err);
      Alert.alert('Submission Error', err.message || 'Vehicle submission failed.');
    }
  };

  const renderUploadBox = (
    tempId: string,
    vIndex: number,
    fieldKey: VehicleUploadFieldKey,
    title: string,
    isPdfAllowed: boolean = false
  ) => {
    const vehicle = vehicles[vIndex];
    const fileKey = `${tempId}_${fieldKey}`;
    const fileObj = selectedFiles[fileKey];
    const currentUri = (vehicle as any)[fieldKey] || fileObj?.uri;

    return (
      <View key={fieldKey} style={styles.uploadSection}>
        <Text style={styles.inputLabel}>{title}</Text>

        {currentUri ? (
          <View style={styles.uploadPreviewCard}>
            {fieldKey.includes('img') ? (
              <Image source={{ uri: currentUri }} style={styles.uploadPreviewImg} />
            ) : (
              <View style={styles.pdfDocBox}>
                <Text style={styles.pdfIconText}>📄</Text>
                <Text style={styles.pdfNameText} numberOfLines={1}>
                  {fileObj?.name || 'Document Attached'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeUploadBtn}
              onPress={() => {
                setSelectedFiles((prev) => {
                  const copy = { ...prev };
                  delete copy[fileKey];
                  return copy;
                });
                updateVehicleField(vIndex, fieldKey as keyof VehicleProfile, '');
              }}
            >
              <Text style={styles.removeUploadBtnText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadPlaceholderBtn}
            onPress={() => openFilePickerForField(tempId, fieldKey)}
          >
            <Text style={styles.uploadIcon}>{isPdfAllowed ? '📎' : '📷'}</Text>
            <Text style={styles.uploadText}>Select File / Photo</Text>
            <Text style={styles.uploadSubtext}>
              {isPdfAllowed ? 'Supports JPG, PNG, PDF' : 'Supports JPG, PNG'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Counter Header Banner */}
      <View style={styles.counterHeaderBar}>
        <Text style={styles.counterHeaderText}>Vehicles Added: {vehicles.length}</Text>
      </View>

      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressRow}>
          <Text style={styles.stepBadgeText}>
            STEP {currentStep} OF {TOTAL_STEPS}
          </Text>
          <Text style={styles.percentText}>{Math.round((currentStep / TOTAL_STEPS) * 100)}%</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(currentStep / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>

        {draftRestored && (
          <View style={styles.draftBadgeRow}>
            <Text style={styles.draftRestoredText}>✓ Saved Draft Restored</Text>
            <TouchableOpacity onPress={clearDraft}>
              <Text style={styles.clearDraftText}>[ Clear Draft ]</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Global Form Validation Error Notification Banner */}
      <FormErrorBanner
        errors={formErrors}
        onDismiss={() => setFormErrors([])}
      />


      {/* Form Content */}
      <ScrollView ref={scrollViewRef} style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STEP 1: VEHICLE IDENTITY */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>VEHICLE IDENTITY ({vehicles.length})</Text>
            <Text style={styles.stepSubtitle}>Provide official vehicle registration details.</Text>

            {vehicles.map((v, idx) => (
              <View key={v.tempId} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitleText}>Vehicle #{idx + 1}</Text>
                  {vehicles.length > 1 && (
                    <TouchableOpacity style={styles.removeVehicleBtn} onPress={() => removeVehicle(idx)}>
                      <Text style={styles.removeVehicleBtnText}>[ Remove Vehicle ]</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.inputLabel}>
                  VEHICLE RC NO <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={v.vehicle_rc_no}
                  onChangeText={(val) => updateVehicleField(idx, 'vehicle_rc_no', val)}
                  placeholder="e.g. MH12AB1234"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />

                <Text style={styles.inputLabel}>
                  VEHICLE OWNER NAME <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={v.vehicle_owner_name}
                  onChangeText={(val) => updateVehicleField(idx, 'vehicle_owner_name', val)}
                  placeholder="e.g. Gaurav Singh Thakur"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>VEHICLE NICKNAME / CALL SIGN</Text>
                <TextInput
                  style={styles.textInput}
                  value={v.vehicle_nick_name}
                  onChangeText={(val) => updateVehicleField(idx, 'vehicle_nick_name', val)}
                  placeholder="e.g. The Apex Predator"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addVehicleBtn} onPress={addVehicle}>
              <Text style={styles.addVehicleBtnText}>+ Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: VEHICLE SPECIFICATIONS */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>VEHICLE SPECIFICATIONS</Text>
            <Text style={styles.stepSubtitle}>Configure technical motorsport specifications.</Text>

            {vehicles.map((v, idx) => (
              <View key={v.tempId} style={styles.entryContainer}>
                <Text style={styles.entryTitleText}>Vehicle #{idx + 1}: {v.vehicle_nick_name || v.vehicle_rc_no || 'New Car'}</Text>

                <Text style={styles.inputLabel}>
                  MANUFACTURER <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={v.vehicle_manufacturing}
                  onChangeText={(val) => updateVehicleField(idx, 'vehicle_manufacturing', val)}
                  placeholder="e.g. BMW, Honda, Hyundai"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>
                  VEHICLE MODEL <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={v.vehicle_model}
                  onChangeText={(val) => updateVehicleField(idx, 'vehicle_model', val)}
                  placeholder="e.g. M3 Competition, Civic Type R"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>ENGINE CAPACITY (CC)</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(v.vehicle_cc || '')}
                  onChangeText={(val) => updateVehicleField(idx, 'vehicle_cc', val)}
                  placeholder="e.g. 1998"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>TURBOCHARGED</Text>
                <View style={styles.optionRow}>
                  {['Yes', 'No'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.optionChip,
                        v.is_turbo === opt && styles.optionChipActive,
                      ]}
                      onPress={() => updateVehicleField(idx, 'is_turbo', opt)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          v.is_turbo === opt && styles.optionChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>FUEL TYPE</Text>
                <View style={styles.optionRow}>
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((fuel) => (
                    <TouchableOpacity
                      key={fuel}
                      style={[
                        styles.optionChip,
                        v.fuel_type === fuel && styles.optionChipActive,
                      ]}
                      onPress={() => updateVehicleField(idx, 'fuel_type', fuel)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          v.fuel_type === fuel && styles.optionChipTextActive,
                        ]}
                      >
                        {fuel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>DRIVE TYPE</Text>
                <View style={styles.optionRow}>
                  {['FWD', 'RWD', 'AWD', '4WD'].map((drive) => (
                    <TouchableOpacity
                      key={drive}
                      style={[
                        styles.optionChip,
                        v.drive_type === drive && styles.optionChipActive,
                      ]}
                      onPress={() => updateVehicleField(idx, 'drive_type', drive)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          v.drive_type === drive && styles.optionChipTextActive,
                        ]}
                      >
                        {drive}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* STEP 3: REGISTRATION & INSURANCE */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>REGISTRATION & INSURANCE</Text>
            <Text style={styles.stepSubtitle}>Attach RC & Insurance documents.</Text>

            {vehicles.map((v, idx) => (
              <View key={v.tempId} style={styles.entryContainer}>
                <Text style={styles.entryTitleText}>Vehicle #{idx + 1}: {v.vehicle_nick_name || 'Vehicle'}</Text>

                {renderUploadBox(v.tempId, idx, 'rc_upload', 'RC DOCUMENT UPLOAD', true)}

                <Text style={styles.inputLabel}>RC VALIDITY DATE (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={v.rc_validity}
                  onChangeText={(val) => updateVehicleField(idx, 'rc_validity', val)}
                  placeholder="e.g. 2032-05-10"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>INSURANCE POLICY NO</Text>
                <TextInput
                  style={styles.textInput}
                  value={v.insurance_no}
                  onChangeText={(val) => updateVehicleField(idx, 'insurance_no', val)}
                  placeholder="e.g. INS-99887766"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>INSURANCE COMPANY</Text>
                <TextInput
                  style={styles.textInput}
                  value={v.insurance_company}
                  onChangeText={(val) => updateVehicleField(idx, 'insurance_company', val)}
                  placeholder="e.g. HDFC ERGO"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>INSURANCE VALIDITY DATE (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={v.insurance_validity}
                  onChangeText={(val) => updateVehicleField(idx, 'insurance_validity', val)}
                  placeholder="e.g. 2027-11-15"
                  placeholderTextColor={COLORS.textMuted}
                />

                {renderUploadBox(v.tempId, idx, 'insurance_doc_upload', 'INSURANCE DOCUMENT UPLOAD (PDF / Image)', true)}
              </View>
            ))}
          </View>
        )}

        {/* STEP 4: VEHICLE PHOTOS */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>VEHICLE PHOTOS</Text>
            <Text style={styles.stepSubtitle}>Upload 4-angle high resolution photos for each vehicle.</Text>

            {vehicles.map((v, idx) => (
              <View key={v.tempId} style={styles.entryContainer}>
                <Text style={styles.entryTitleText}>Vehicle #{idx + 1}: {v.vehicle_nick_name || 'Vehicle'}</Text>

                {renderUploadBox(v.tempId, idx, 'vehicle_img_front', '1. FRONT VIEW PHOTO', false)}
                {renderUploadBox(v.tempId, idx, 'vehicle_img_back', '2. BACK VIEW PHOTO', false)}
                {renderUploadBox(v.tempId, idx, 'vehicle_img_left', '3. LEFT SIDE PHOTO', false)}
                {renderUploadBox(v.tempId, idx, 'vehicle_img_right', '4. RIGHT SIDE PHOTO', false)}
              </View>
            ))}
          </View>
        )}

        {/* STEP 5: ADDITIONAL INFORMATION */}
        {currentStep === 5 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>ADDITIONAL INFORMATION</Text>
            <Text style={styles.stepSubtitle}>Performance modifications or racing notes.</Text>

            {vehicles.map((v, idx) => (
              <View key={v.tempId} style={styles.entryContainer}>
                <Text style={styles.entryTitleText}>Vehicle #{idx + 1}: {v.vehicle_nick_name || 'Vehicle'}</Text>

                <Text style={styles.inputLabel}>ADDITIONAL SPECS / NOTES</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={v.vehicle_additional_info}
                  onChangeText={(val) => updateVehicleField(idx, 'vehicle_additional_info', val)}
                  placeholder="e.g. Stage 2 Tuned, Performance Exhaust, Roll Cage installed"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.inputLabel}>VEHICLE STATUS</Text>
                <View style={styles.optionRow}>
                  {[
                    { label: 'Active', value: 1 },
                    { label: 'Inactive', value: 0 },
                  ].map((st) => (
                    <TouchableOpacity
                      key={st.label}
                      style={[
                        styles.optionChip,
                        v.status === st.value && styles.optionChipActive,
                      ]}
                      onPress={() => updateVehicleField(idx, 'status', st.value)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          v.status === st.value && styles.optionChipTextActive,
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* STEP 6: REVIEW & SUBMIT */}
        {currentStep === 6 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>REVIEW & SUBMIT ({vehicles.length} VEHICLES)</Text>
            <Text style={styles.stepSubtitle}>Verify all vehicle entries before final submission.</Text>

            {vehicles.map((v, idx) => (
              <View key={v.tempId} style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>VEHICLE #{idx + 1}: {v.vehicle_nick_name || v.vehicle_rc_no}</Text>
                <Text style={styles.reviewLine}>RC No: {v.vehicle_rc_no || 'N/A'}</Text>
                <Text style={styles.reviewLine}>Owner: {v.vehicle_owner_name || 'N/A'}</Text>
                <Text style={styles.reviewLine}>
                  Make / Model: {v.vehicle_manufacturing} {v.vehicle_model}
                </Text>
                <Text style={styles.reviewLine}>
                  Engine: {v.vehicle_cc} CC | Turbo: {v.is_turbo} | {v.fuel_type} ({v.drive_type})
                </Text>
                <Text style={styles.reviewLine}>
                  Insurance: {v.insurance_no || 'N/A'} ({v.insurance_company || 'N/A'})
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        {currentStep > 1 ? (
          <TouchableOpacity
            style={styles.prevBtn}
            onPress={handlePrevious}
            disabled={isSubmitting}
          >
            <Text style={styles.prevBtnText}>❮ Previous</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isSubmitting}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {currentStep < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next ❯</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'SUBMITTING…' : 'SUBMIT VEHICLES ➔'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal Pickers */}
      <Modal visible={pickerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.modalTitle}>Choose File Source</Text>
            <Text style={styles.modalSubtitle}>
              Select camera, photo gallery, or document file.
            </Text>

            <TouchableOpacity style={styles.pickerOptionBtn} onPress={handlePickCamera}>
              <Text style={styles.pickerOptionIcon}>📷</Text>
              <Text style={styles.pickerOptionText}>Take Photo with Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerOptionBtn} onPress={handlePickGallery}>
              <Text style={styles.pickerOptionIcon}>🖼️</Text>
              <Text style={styles.pickerOptionText}>Choose from Photo Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerOptionBtn} onPress={handlePickDocument}>
              <Text style={styles.pickerOptionIcon}>📁</Text>
              <Text style={styles.pickerOptionText}>Choose Document File (PDF / Images)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerCancelBtn}
              onPress={() => setPickerModalVisible(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Progress Modal */}
      {isSubmitting && uploadStatus && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.uploadProgressCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.uploadProgressTitle}>{uploadStatus.stepName}</Text>
              <Text style={styles.uploadProgressPercent}>{uploadStatus.percent}%</Text>

              <View style={styles.progressTrackOverlay}>
                <View
                  style={[
                    styles.progressFillOverlay,
                    { width: `${uploadStatus.percent}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  counterHeaderBar: {
    backgroundColor: '#111111',
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  counterHeaderText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '800',
  },
  progressHeader: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  percentText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  draftBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  draftRestoredText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '700',
  },
  clearDraftText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  stepCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 20,
  },
  stepTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  entryContainer: {
    backgroundColor: '#0D0D0D',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 14,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  entryTitleText: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '800',
  },
  removeVehicleBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeVehicleBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  addVehicleBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  addVehicleBtnText: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '800',
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  asterisk: {
    color: COLORS.accentOrange,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  optionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  optionChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: COLORS.white,
  },
  uploadSection: {
    marginTop: 10,
  },
  uploadPlaceholderBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  uploadText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  uploadSubtext: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  uploadPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  uploadPreviewImg: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  pdfDocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pdfIconText: {
    fontSize: 20,
    marginRight: 8,
  },
  pdfNameText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  removeUploadBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeUploadBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewSection: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 12,
  },
  reviewSectionTitle: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  reviewLine: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  prevBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  nextBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  nextBtnText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  pickerOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  pickerOptionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  pickerOptionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  pickerCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  pickerCancelText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  uploadProgressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  uploadProgressTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  uploadProgressPercent: {
    color: COLORS.primaryLight,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  progressTrackOverlay: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFillOverlay: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});
