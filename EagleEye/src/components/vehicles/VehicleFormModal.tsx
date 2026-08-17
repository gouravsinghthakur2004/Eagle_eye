import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Keyboard,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { InputField } from '../forms/InputField';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { DatePickerInput } from '../common/DatePickerInput';
import { FileUploadInput } from '../common/FileUploadInput';
import { KeyboardAwareFormContainer, KeyboardAwareFormContainerRef } from '../common/KeyboardAwareFormContainer';
import { VehicleProfile } from '@/types';
import { SelectedFile } from '@/utils/fileValidation';
import { fileCompression } from '@/utils/fileCompression';
import { vehicleService } from '@/services/vehicleService';
import { useAppNavigation } from '@/context/NavigationContext';
import { validateRcNumber, validateName } from '@/utils/formValidation';
import { useNotification } from '@/hooks/useNotification';
import { FormErrorBanner } from '../common/FormErrorBanner';

interface VehicleFormModalProps {
  visible: boolean;
  initialValues?: VehicleProfile | null;
  onSave: (savedVehicle: VehicleProfile) => void;
  onClose: () => void;
}

const TOTAL_STEPS = 4;
const STEP_TITLES = [
  'Vehicle Identity & Specs',
  'Drivetrain & Performance',
  'Registration & Insurance',
  'Vehicle Inspection Photos',
];

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  visible,
  initialValues,
  onSave,
  onClose,
}) => {
  const { user } = useAppNavigation();
  const { showSuccess, showError } = useNotification();
  const userId = user?.id || (user as any)?.user_id;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<VehicleProfile>>({
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
    insurance_company: '',
    insurance_validity: '',
    insurance_doc_upload: '',
    fitness_upload: '',
    fitness_validity: '',
    vehicle_img_front: '',
    vehicle_img_back: '',
    vehicle_img_left: '',
    vehicle_img_right: '',
    vehicle_additional_info: '',
    status: 1,
  });

  const [selectedFiles, setSelectedFiles] = useState<
    Partial<
      Record<
        | 'rc_upload'
        | 'insurance_doc_upload'
        | 'fitness_upload'
        | 'vehicle_img_front'
        | 'vehicle_img_back'
        | 'vehicle_img_left'
        | 'vehicle_img_right',
        SelectedFile
      >
    >
  >({});

  const formContainerRef = useRef<KeyboardAwareFormContainerRef>(null);

  useEffect(() => {
    Keyboard.dismiss();
    setFormErrors([]);
    setFieldErrors({});
    const timer = setTimeout(() => {
      formContainerRef.current?.scrollTo({ y: 0, animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      setFormErrors([]);
      setFieldErrors({});
      setSelectedFiles({});

      if (initialValues) {
        setFormData({
          id: initialValues.id,
          vehicle_rc_no: initialValues.vehicle_rc_no || '',
          vehicle_owner_name: initialValues.vehicle_owner_name || '',
          vehicle_nick_name: initialValues.vehicle_nick_name || '',
          vehicle_manufacturing: initialValues.vehicle_manufacturing || '',
          vehicle_model: initialValues.vehicle_model || '',
          vehicle_cc: initialValues.vehicle_cc ? String(initialValues.vehicle_cc) : '',
          is_turbo: String(initialValues.is_turbo) === 'Yes' || String(initialValues.is_turbo) === '1' ? 'Yes' : 'No',
          fuel_type: initialValues.fuel_type || 'Petrol',
          drive_type: initialValues.drive_type || 'RWD',
          rc_upload: initialValues.rc_upload || '',
          rc_validity: initialValues.rc_validity || '',
          insurance_no: initialValues.insurance_no || '',
          insurance_company: initialValues.insurance_company || '',
          insurance_validity: initialValues.insurance_validity || '',
          insurance_doc_upload: initialValues.insurance_doc_upload || '',
          fitness_upload: (initialValues as any).fitness_upload || '',
          fitness_validity: (initialValues as any).fitness_validity || '',
          vehicle_img_front: initialValues.vehicle_img_front || '',
          vehicle_img_back: initialValues.vehicle_img_back || '',
          vehicle_img_left: initialValues.vehicle_img_left || '',
          vehicle_img_right: initialValues.vehicle_img_right || '',
          vehicle_additional_info: initialValues.vehicle_additional_info || '',
          status: initialValues.status ?? 1,
        });
      } else {
        setFormData({
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
          insurance_company: '',
          insurance_validity: '',
          insurance_doc_upload: '',
          fitness_upload: '',
          fitness_validity: '',
          vehicle_img_front: '',
          vehicle_img_back: '',
          vehicle_img_left: '',
          vehicle_img_right: '',
          vehicle_additional_info: '',
          status: 1,
        });
      }
    }
  }, [visible, initialValues]);

  const handleChange = (key: keyof VehicleProfile | 'fitness_upload' | 'fitness_validity', value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleFileChange = (
    fieldKey:
      | 'rc_upload'
      | 'insurance_doc_upload'
      | 'fitness_upload'
      | 'vehicle_img_front'
      | 'vehicle_img_back'
      | 'vehicle_img_left'
      | 'vehicle_img_right',
    fileObj: SelectedFile | null
  ) => {
    if (fileObj) {
      setSelectedFiles((prev) => ({ ...prev, [fieldKey]: fileObj }));
      handleChange(fieldKey, fileObj.uri);
    } else {
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[fieldKey];
        return copy;
      });
      handleChange(fieldKey, '');
    }
  };

  const validateCurrentStep = (step: number): boolean => {
    const errors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    if (step === 1) {
      // Step 1: Vehicle Identity & Specs
      const rcTrimmed = (formData.vehicle_rc_no || '').trim();
      const ownerTrimmed = (formData.vehicle_owner_name || '').trim();
      const makeTrimmed = (formData.vehicle_manufacturing || '').trim();
      const modelTrimmed = (formData.vehicle_model || '').trim();

      if (!rcTrimmed) {
        errors.push('Vehicle RC / Registration Number is required.');
        newFieldErrors.vehicle_rc_no = 'RC Number is required';
      } else if (!validateRcNumber(rcTrimmed)) {
        errors.push('Please enter a valid RC Number (minimum 4 characters, letters and numbers).');
        newFieldErrors.vehicle_rc_no = 'Invalid RC number format';
      }

      if (!ownerTrimmed) {
        errors.push('Vehicle Owner Name is required.');
        newFieldErrors.vehicle_owner_name = 'Owner name is required';
      } else if (!validateName(ownerTrimmed)) {
        errors.push('Owner Name must contain only alphabets and spaces.');
        newFieldErrors.vehicle_owner_name = 'Invalid characters in name';
      }

      if (!makeTrimmed) {
        errors.push('Vehicle Manufacturer / Make is required.');
        newFieldErrors.vehicle_manufacturing = 'Manufacturer is required';
      }

      if (!modelTrimmed) {
        errors.push('Vehicle Model is required.');
        newFieldErrors.vehicle_model = 'Model is required';
      }
    }

    setFormErrors(errors);
    setFieldErrors(newFieldErrors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep(currentStep)) return;

    // Full validation before submission
    const allErrors: string[] = [];
    if (!formData.vehicle_rc_no?.trim()) {
      allErrors.push('Vehicle RC Number is required.');
    }
    if (!formData.vehicle_owner_name?.trim()) {
      allErrors.push('Vehicle Owner Name is required.');
    }
    if (!formData.vehicle_manufacturing?.trim()) {
      allErrors.push('Vehicle Manufacturer is required.');
    }
    if (!formData.vehicle_model?.trim()) {
      allErrors.push('Vehicle Model is required.');
    }

    if (allErrors.length > 0) {
      setFormErrors(allErrors);
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    setFormErrors([]);

    try {
      // Compress any newly selected images before upload
      const optimizedFilesMap: Record<string, SelectedFile> = {};
      for (const [key, fileObj] of Object.entries(selectedFiles)) {
        if (fileObj) {
          const compressed = await fileCompression.compressImageIfNeeded(fileObj);
          optimizedFilesMap[key] = compressed.file;
        }
      }

      const res = await vehicleService.saveVehicle(
        formData,
        userId,
        Object.keys(optimizedFilesMap).length > 0 ? optimizedFilesMap : undefined
      );

      if (res.success && res.data) {
        showSuccess(
          initialValues ? 'Vehicle Updated' : 'Vehicle Registered',
          res.message || 'Vehicle profile saved successfully.'
        );
        onSave(res.data);
        onClose();
      } else {
        const errMsg = res.message || 'Failed to save vehicle profile. Please try again.';
        setFormErrors([errMsg]);
        showError('Vehicle Save Failed', errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Network error occurred while saving vehicle.';
      setFormErrors([errMsg]);
      showError('Error', errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Modal Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>🏎️</Text>
              <Text style={styles.headerTitle}>
                {initialValues ? 'Edit Vehicle Profile' : 'Register New Vehicle'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Step Progress Tracker */}
          <View style={styles.stepBar}>
            <Text style={styles.stepText}>
              Step {currentStep} of {TOTAL_STEPS}: {STEP_TITLES[currentStep - 1]}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / TOTAL_STEPS) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Step Body Content with Keyboard-Aware Scrolling */}
          <KeyboardAwareFormContainer
            ref={formContainerRef}
            contentContainerStyle={styles.scrollContent}
            extraScrollHeight={100}
          >
            {/* Global Form Validation Error Notification Banner */}
            <FormErrorBanner
              errors={formErrors}
              onDismiss={() => setFormErrors([])}
            />

            {/* STEP 1: VEHICLE IDENTITY & SPECS */}
            {currentStep === 1 && (
              <View style={styles.formSection}>
                <InputField
                  label="Vehicle RC / Plate Number"
                  placeholder="e.g. MH12AB1234 / MP09CD0186"
                  value={formData.vehicle_rc_no || ''}
                  onChangeText={(val) => handleChange('vehicle_rc_no', val)}
                  icon="🚗"
                  required
                  autoCapitalize="characters"
                  error={fieldErrors.vehicle_rc_no}
                />

                <InputField
                  label="Registered Owner Name"
                  placeholder="e.g. Gaurav Singh Thakur"
                  value={formData.vehicle_owner_name || ''}
                  onChangeText={(val) => handleChange('vehicle_owner_name', val)}
                  icon="👤"
                  required
                  error={fieldErrors.vehicle_owner_name}
                />

                <InputField
                  label="Vehicle Nickname / Call Sign"
                  placeholder="e.g. Apex Beast, Red Bull Rally"
                  value={formData.vehicle_nick_name || ''}
                  onChangeText={(val) => handleChange('vehicle_nick_name', val)}
                  icon="🏷️"
                />

                <InputField
                  label="Manufacturer / Make"
                  placeholder="e.g. BMW, Honda, Hyundai, Volkswagen"
                  value={formData.vehicle_manufacturing || ''}
                  onChangeText={(val) => handleChange('vehicle_manufacturing', val)}
                  icon="🏭"
                  required
                  error={fieldErrors.vehicle_manufacturing}
                />

                <InputField
                  label="Vehicle Model"
                  placeholder="e.g. M3 Competition, Civic Type R, Polo GT"
                  value={formData.vehicle_model || ''}
                  onChangeText={(val) => handleChange('vehicle_model', val)}
                  icon="🏎️"
                  required
                  error={fieldErrors.vehicle_model}
                />

                <InputField
                  label="Engine Capacity (CC)"
                  placeholder="e.g. 1998"
                  value={formData.vehicle_cc ? String(formData.vehicle_cc) : ''}
                  onChangeText={(val) => handleChange('vehicle_cc', val)}
                  icon="⚙️"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* STEP 2: DRIVETRAIN & PERFORMANCE */}
            {currentStep === 2 && (
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Fuel Type</Text>
                <View style={styles.optionRow}>
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((fuel) => (
                    <TouchableOpacity
                      key={fuel}
                      style={[
                        styles.optionChip,
                        formData.fuel_type === fuel && styles.optionChipActive,
                      ]}
                      onPress={() => handleChange('fuel_type', fuel)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          formData.fuel_type === fuel && styles.optionChipTextActive,
                        ]}
                      >
                        {fuel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Drivetrain</Text>
                <View style={styles.optionRow}>
                  {['FWD', 'RWD', 'AWD', '4WD'].map((drive) => (
                    <TouchableOpacity
                      key={drive}
                      style={[
                        styles.optionChip,
                        formData.drive_type === drive && styles.optionChipActive,
                      ]}
                      onPress={() => handleChange('drive_type', drive)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          formData.drive_type === drive && styles.optionChipTextActive,
                        ]}
                      >
                        {drive}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Turbocharged / Supercharged</Text>
                <View style={styles.optionRow}>
                  {['Yes', 'No'].map((turbo) => (
                    <TouchableOpacity
                      key={turbo}
                      style={[
                        styles.optionChip,
                        formData.is_turbo === turbo && styles.optionChipActive,
                      ]}
                      onPress={() => handleChange('is_turbo', turbo)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          formData.is_turbo === turbo && styles.optionChipTextActive,
                        ]}
                      >
                        {turbo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <InputField
                  label="Additional Notes / Modifications"
                  placeholder="e.g. Roll cage fitted, FIA homologated seats, ECU remap..."
                  value={formData.vehicle_additional_info || ''}
                  onChangeText={(val) => handleChange('vehicle_additional_info', val)}
                  icon="📝"
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}

            {/* STEP 3: REGISTRATION & INSURANCE */}
            {currentStep === 3 && (
              <View style={styles.formSection}>
                <FileUploadInput
                  label="RC Document Upload (PDF / Image)"
                  value={formData.rc_upload}
                  onFileSelected={(fileObj) => handleFileChange('rc_upload', fileObj)}
                  icon="📄"
                />

                <DatePickerInput
                  label="RC Validity Date"
                  value={formData.rc_validity || ''}
                  onChangeDate={(val) => handleChange('rc_validity', val)}
                  icon="📅"
                  placeholder="Select RC Expiry Date"
                  minYear={2020}
                  maxYear={2045}
                />

                <InputField
                  label="Insurance Policy Number"
                  placeholder="e.g. POL-9988776655"
                  value={formData.insurance_no || ''}
                  onChangeText={(val) => handleChange('insurance_no', val)}
                  icon="🛡️"
                />

                <InputField
                  label="Insurance Provider / Company"
                  placeholder="e.g. HDFC ERGO, ICICI Lombard, Bajaj Allianz"
                  value={formData.insurance_company || ''}
                  onChangeText={(val) => handleChange('insurance_company', val)}
                  icon="🏢"
                />

                <DatePickerInput
                  label="Insurance Expiry Date"
                  value={formData.insurance_validity || ''}
                  onChangeDate={(val) => handleChange('insurance_validity', val)}
                  icon="📅"
                  placeholder="Select Insurance Expiry Date"
                  minYear={2024}
                  maxYear={2045}
                />

                <FileUploadInput
                  label="Insurance Policy Document (PDF / Image)"
                  value={formData.insurance_doc_upload}
                  onFileSelected={(fileObj) => handleFileChange('insurance_doc_upload', fileObj)}
                  icon="📄"
                />

                <FileUploadInput
                  label="Vehicle Fitness Certificate (PDF / Image)"
                  value={(formData as any).fitness_upload}
                  onFileSelected={(fileObj) => handleFileChange('fitness_upload', fileObj)}
                  icon="📄"
                />

                <DatePickerInput
                  label="Fitness Validity Date"
                  value={(formData as any).fitness_validity || ''}
                  onChangeDate={(val) => handleChange('fitness_validity', val)}
                  icon="📅"
                  placeholder="Select Fitness Expiry Date"
                  minYear={2020}
                  maxYear={2045}
                />
              </View>
            )}

            {/* STEP 4: VEHICLE INSPECTION PHOTOS (4 ANGLES) */}
            {currentStep === 4 && (
              <View style={styles.formSection}>
                <Text style={styles.subHeaderNote}>
                  Please provide photos of the vehicle from all 4 primary angles for technical scrutiny.
                </Text>

                <FileUploadInput
                  label="1. Front View Photo (JPG/PNG)"
                  value={formData.vehicle_img_front}
                  onFileSelected={(fileObj) => handleFileChange('vehicle_img_front', fileObj)}
                  icon="📷"
                />

                <FileUploadInput
                  label="2. Rear View Photo (JPG/PNG)"
                  value={formData.vehicle_img_back}
                  onFileSelected={(fileObj) => handleFileChange('vehicle_img_back', fileObj)}
                  icon="📷"
                />

                <FileUploadInput
                  label="3. Left Profile Photo (JPG/PNG)"
                  value={formData.vehicle_img_left}
                  onFileSelected={(fileObj) => handleFileChange('vehicle_img_left', fileObj)}
                  icon="📷"
                />

                <FileUploadInput
                  label="4. Right Profile Photo (JPG/PNG)"
                  value={formData.vehicle_img_right}
                  onFileSelected={(fileObj) => handleFileChange('vehicle_img_right', fileObj)}
                  icon="📷"
                />
              </View>
            )}

            {/* Modal Step Actions (Natural Scrollable Form End) */}
            <View style={styles.footerBar}>
              <View style={styles.footerBtnWrapper}>
                <SecondaryButton
                  title={currentStep === 1 ? 'Cancel' : 'Back'}
                  onPress={handleBack}
                  disabled={saving}
                />
              </View>
              <View style={styles.footerBtnWrapper}>
                {currentStep < TOTAL_STEPS ? (
                  <PrimaryButton title="Next ❯" onPress={handleNext} disabled={saving} />
                ) : (
                  <PrimaryButton
                    title={saving ? 'Saving...' : 'Save Vehicle 🏎️'}
                    onPress={handleSubmit}
                    loading={saving}
                  />
                )}
              </View>
            </View>
          </KeyboardAwareFormContainer>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '92%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '800',
  },
  stepBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  stepText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  formSection: {
    gap: 4,
    marginBottom: 16,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subHeaderNote: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  optionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  footerBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  footerBtnWrapper: {
    flex: 1,
  },
});
