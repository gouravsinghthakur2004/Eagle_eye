import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { InputField } from '../forms/InputField';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { DatePickerInput } from '../common/DatePickerInput';
import { FileUploadInput } from '../common/FileUploadInput';
import { DriverNavigatorProfile } from '@/types';
import { SelectedFile } from '@/utils/fileValidation';
import { fileCompression } from '@/utils/fileCompression';
import { driverNavigatorService } from '@/services/driverNavigatorService';
import { useAppNavigation } from '@/context/NavigationContext';
import { validateName, validatePhone, validateBloodGroup } from '@/utils/formValidation';

interface NavigatorFormModalProps {
  visible: boolean;
  initialValues?: DriverNavigatorProfile | null;
  existingMobiles?: string[];
  onSave: (savedNavigator: DriverNavigatorProfile) => void;
  onClose: () => void;
}

const TOTAL_STEPS = 5;
const STEP_TITLES = [
  'Personal Identity',
  'Contact Information',
  'License & Documents',
  'Emergency & Health',
  'Federation & Insurance',
];

import { useNotification } from '@/hooks/useNotification';
import { FormErrorBanner } from '../common/FormErrorBanner';

export const NavigatorFormModal: React.FC<NavigatorFormModalProps> = ({
  visible,
  initialValues,
  existingMobiles = [],
  onSave,
  onClose,
}) => {
  const { user } = useAppNavigation();
  const { showSuccess, showError, showWarning } = useNotification();
  const userId = user?.id || (user as any)?.user_id;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<DriverNavigatorProfile>>({
    role_type: 'navigator',
    full_name: '',
    race_nick_name: '',
    blood_group: '',
    dob: '',
    country: '',
    gender: '',
    mobile_no: '',
    alternate_mobile_no: '',
    email: '',
    dl_no: '',
    dl_validity: '',
    dl_upload: '',
    driver_pic_upload: '',
    instagram_handle: '',
    emergency_contact_name: '',
    emergency_contact_no: '',
    relation: '',
    t_shirt_size: '',
    asn_fmn_lic: '',
    insurance_no: '',
    insurance_document: '',
    insurance_validity: '',
    medical_condition: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<
    Partial<Record<'driver_pic_upload' | 'dl_upload' | 'insurance_document', SelectedFile>>
  >({});

  const firstInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    Keyboard.dismiss();
    setFormErrors([]);
    setFieldErrors({});
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [currentStep, visible]);

  useEffect(() => {
    setFormErrors([]);
    setFieldErrors({});
    if (initialValues) {
      setFormData({ ...initialValues, role_type: 'navigator' });
    } else {
      setFormData({
        role_type: 'navigator',
        full_name: '',
        race_nick_name: '',
        blood_group: '',
        dob: '',
        country: '',
        gender: '',
        mobile_no: '',
        alternate_mobile_no: '',
        email: '',
        dl_no: '',
        dl_validity: '',
        dl_upload: '',
        driver_pic_upload: '',
        instagram_handle: '',
        emergency_contact_name: '',
        emergency_contact_no: '',
        relation: '',
        t_shirt_size: '',
        asn_fmn_lic: '',
        insurance_no: '',
        insurance_document: '',
        insurance_validity: '',
        medical_condition: '',
      });
    }
    setSelectedFiles({});
    setCurrentStep(1);
  }, [initialValues, visible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [currentStep, visible]);

  const handleChange = (key: keyof DriverNavigatorProfile, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    if (formErrors.length > 0) setFormErrors([]);
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleFileChange = (
    key: 'driver_pic_upload' | 'dl_upload' | 'insurance_document',
    fileObj: SelectedFile | null
  ) => {
    if (fileObj) {
      setSelectedFiles((prev) => ({ ...prev, [key]: fileObj }));
      handleChange(key, fileObj.uri);
    } else {
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      handleChange(key, '');
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];
    const fErrors: Record<string, string> = {};

    // STEP 1: Personal Identity
    if (currentStep === 1) {
      const nameVal = validateName(formData.full_name || '', 'Navigator Full Legal Name');
      if (!nameVal.isValid) {
        const msg = nameVal.error || 'Navigator Full Legal Name is required.';
        errors.push(msg);
        fErrors.full_name = msg;
      }

      if (formData.blood_group?.trim()) {
        const bloodVal = validateBloodGroup(formData.blood_group.trim());
        if (!bloodVal.isValid) {
          const msg = bloodVal.error || 'Invalid Blood Group format (e.g. O+, A+, B+, AB-).';
          errors.push(msg);
          fErrors.blood_group = msg;
        }
      }
    }

    // STEP 2: Contact Information
    if (currentStep === 2) {
      const phoneVal = validatePhone(formData.mobile_no || '', 'Mobile Number');
      if (!phoneVal.isValid) {
        const msg = phoneVal.error || 'A valid 10-digit mobile number is required.';
        errors.push(msg);
        fErrors.mobile_no = msg;
      }

      const cleaned = (formData.mobile_no || '').replace(/[^0-9]/g, '');
      const isDuplicate = existingMobiles.some(
        (m) => m === cleaned && (!initialValues || initialValues.mobile_no !== cleaned)
      );
      if (isDuplicate) {
        const msg = 'This mobile number is already registered for another Navigator.';
        errors.push(msg);
        fErrors.mobile_no = msg;
      }
    }

    if (errors.length > 0) {
      Keyboard.dismiss();
      setFormErrors(errors);
      setFieldErrors(fErrors);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 50);
      return false;
    }

    setFormErrors([]);
    setFieldErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep((prev) => prev + 1);
      }
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
    if (!validateCurrentStep()) return;

    try {
      setSaving(true);

      const finalData: Partial<DriverNavigatorProfile> = { ...formData, role_type: 'navigator' };

      if (selectedFiles.driver_pic_upload) {
        const res = await fileCompression.compressImageIfNeeded(selectedFiles.driver_pic_upload);
        finalData.driver_pic_upload = res.file.uri;
      }
      if (selectedFiles.dl_upload) {
        const res = await fileCompression.compressImageIfNeeded(selectedFiles.dl_upload);
        finalData.dl_upload = res.file.uri;
      }
      if (selectedFiles.insurance_document) {
        const res = await fileCompression.compressImageIfNeeded(selectedFiles.insurance_document);
        finalData.insurance_document = res.file.uri;
      }

      const res = await driverNavigatorService.saveProfile(finalData, userId);
      setSaving(false);

      if (res.success && res.data) {
        showSuccess('Navigator Saved 🗺️', 'Navigator profile saved successfully!');
        onSave(res.data);
        onClose();
      } else {
        showError('Save Failed', res.message || 'Could not save navigator.');
      }
    } catch (err: any) {
      setSaving(false);
      showError('Error', err.message || 'Navigator save failed.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.container}>
            {/* Modal Header */}
            <View style={styles.headerBar}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerIcon}>🗺️</Text>
                <Text style={styles.headerTitle}>
                  {initialValues ? 'Edit Navigator' : 'Add New Navigator'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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

            {/* Step Body Content */}
            <ScrollView ref={scrollViewRef} style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Global Form Validation Error Notification - Always rendered inside scroll top */}
              <FormErrorBanner
                errors={formErrors}
                onDismiss={() => setFormErrors([])}
              />

              {currentStep === 1 && (
                <View style={styles.formSection}>
                  <InputField
                    label="Full Legal Name *"
                    placeholder="e.g. Carlos Sainz Sr"
                    value={formData.full_name || ''}
                    onChangeText={(val) => handleChange('full_name', val)}
                    icon="👤"
                    required
                    error={fieldErrors.full_name}
                  />
                  <InputField
                    label="Race / Call Sign Nickname"
                    placeholder="e.g. Chili"
                    value={formData.race_nick_name || ''}
                    onChangeText={(val) => handleChange('race_nick_name', val)}
                    icon="🏎️"
                  />
                  <InputField
                    label="Blood Group"
                    placeholder="e.g. O+, A+, B+, AB-"
                    value={formData.blood_group || ''}
                    onChangeText={(val) => handleChange('blood_group', val)}
                    icon="🩸"
                    error={fieldErrors.blood_group}
                  />
                  <DatePickerInput
                    label="Date of Birth"
                    value={formData.dob || ''}
                    onChangeDate={(val) => handleChange('dob', val)}
                    icon="🎂"
                    placeholder="Select Date of Birth"
                    minYear={1950}
                    maxYear={2015}
                  />
                  <InputField
                    label="Country"
                    placeholder="e.g. India"
                    value={formData.country || ''}
                    onChangeText={(val) => handleChange('country', val)}
                    icon="🌐"
                  />
                  <InputField
                    label="Gender"
                    placeholder="e.g. Male, Female, Other"
                    value={formData.gender || ''}
                    onChangeText={(val) => handleChange('gender', val)}
                    icon="⚧️"
                  />
                </View>
              )}

              {currentStep === 2 && (
                <View style={styles.formSection}>
                  <InputField
                    label="Primary Mobile Number *"
                    placeholder="e.g. 9876543210"
                    value={formData.mobile_no || ''}
                    onChangeText={(val) => handleChange('mobile_no', val)}
                    keyboardType="phone-pad"
                    icon="📱"
                    required
                    error={fieldErrors.mobile_no}
                  />
                  <InputField
                    label="Alternate Contact Number"
                    placeholder="e.g. 9123456789"
                    value={formData.alternate_mobile_no || ''}
                    onChangeText={(val) => handleChange('alternate_mobile_no', val)}
                    keyboardType="phone-pad"
                    icon="📞"
                  />
                  <InputField
                    label="Email Address"
                    placeholder="e.g. navigator@eagleeye.com"
                    value={formData.email || ''}
                    onChangeText={(val) => handleChange('email', val)}
                    keyboardType="email-address"
                    icon="✉️"
                  />
                  <InputField
                    label="Instagram Handle"
                    placeholder="e.g. @navigator_racing"
                    value={formData.instagram_handle || ''}
                    onChangeText={(val) => handleChange('instagram_handle', val)}
                    icon="📸"
                  />
                </View>
              )}

              {currentStep === 3 && (
                <View style={styles.formSection}>
                  <InputField
                    label="Driving License Number"
                    placeholder="e.g. MP092021004589"
                    value={formData.dl_no || ''}
                    onChangeText={(val) => handleChange('dl_no', val)}
                    icon="🪪"
                  />
                  <DatePickerInput
                    label="Driving License Validity"
                    value={formData.dl_validity || ''}
                    onChangeDate={(val) => handleChange('dl_validity', val)}
                    icon="📅"
                    placeholder="Select DL Expiry Date"
                    minYear={2024}
                    maxYear={2045}
                  />
                  <FileUploadInput
                    label="Driving License Upload (JPG/PNG/PDF)"
                    value={formData.dl_upload}
                    onFileSelected={(fileObj) => handleFileChange('dl_upload', fileObj)}
                    icon="📄"
                  />
                  <FileUploadInput
                    label="Navigator Profile Photo / Avatar"
                    value={formData.driver_pic_upload}
                    onFileSelected={(fileObj) => handleFileChange('driver_pic_upload', fileObj)}
                    icon="📷"
                  />
                </View>
              )}

              {currentStep === 4 && (
                <View style={styles.formSection}>
                  <InputField
                    label="Emergency Contact Person"
                    placeholder="e.g. Suresh Sainz"
                    value={formData.emergency_contact_name || ''}
                    onChangeText={(val) => handleChange('emergency_contact_name', val)}
                    icon="🆘"
                  />
                  <InputField
                    label="Emergency Contact Phone"
                    placeholder="e.g. 9826012345"
                    value={formData.emergency_contact_no || ''}
                    onChangeText={(val) => handleChange('emergency_contact_no', val)}
                    keyboardType="phone-pad"
                    icon="📞"
                  />
                  <InputField
                    label="Relationship"
                    placeholder="e.g. Father, Spouse, Team Manager"
                    value={formData.relation || ''}
                    onChangeText={(val) => handleChange('relation', val)}
                    icon="👥"
                  />
                  <InputField
                    label="Race Suit T-Shirt Size"
                    placeholder="e.g. S, M, L, XL, XXL"
                    value={formData.t_shirt_size || ''}
                    onChangeText={(val) => handleChange('t_shirt_size', val)}
                    icon="👕"
                  />
                  <InputField
                    label="Medical Conditions / Allergies"
                    placeholder="e.g. None, Asthma"
                    value={formData.medical_condition || ''}
                    onChangeText={(val) => handleChange('medical_condition', val)}
                    multiline
                    numberOfLines={3}
                    icon="🏥"
                  />
                </View>
              )}

              {currentStep === 5 && (
                <View style={styles.formSection}>
                  <InputField
                    label="ASN / FMN Competition License"
                    placeholder="e.g. FMSC-2026-9812"
                    value={formData.asn_fmn_lic || ''}
                    onChangeText={(val) => handleChange('asn_fmn_lic', val)}
                    icon="🏁"
                  />
                  <InputField
                    label="Motorsport Insurance Policy No"
                    placeholder="e.g. HDFC-RACE-884920"
                    value={formData.insurance_no || ''}
                    onChangeText={(val) => handleChange('insurance_no', val)}
                    icon="🛡️"
                  />
                  <DatePickerInput
                    label="Insurance Expiry Date"
                    value={formData.insurance_validity || ''}
                    onChangeDate={(val) => handleChange('insurance_validity', val)}
                    icon="📆"
                    placeholder="Select Insurance Expiry Date"
                    minYear={2024}
                    maxYear={2035}
                  />
                  <FileUploadInput
                    label="Insurance Document Upload (JPG/PNG/PDF)"
                    value={formData.insurance_document}
                    onFileSelected={(fileObj) => handleFileChange('insurance_document', fileObj)}
                    icon="📄"
                  />
                </View>
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
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
                    title={saving ? 'Saving...' : 'Save Navigator 🏁'}
                    onPress={handleSubmit}
                    loading={saving}
                  />
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
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
    color: '#60A5FA',
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
    backgroundColor: '#3B82F6',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    gap: 8,
    paddingBottom: 20,
  },
  footerBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  footerBtnWrapper: {
    flex: 1,
  },
});
