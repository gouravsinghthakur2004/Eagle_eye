import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { InputField } from '../forms/InputField';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { DatePickerInput } from './DatePickerInput';
import { FileUploadInput } from './FileUploadInput';
import { KeyboardAwareFormContainer, KeyboardAwareFormContainerRef } from './KeyboardAwareFormContainer';
import { useDriverNavigatorDraft } from '@/hooks/useDriverNavigatorDraft';
import { DriverNavigatorProfile } from '@/types';
import { RoleType } from '@/hooks/useDriverNavigatorProfile';
import { SelectedFile } from '@/utils/fileValidation';
import { fileCompression } from '@/utils/fileCompression';

interface DriverNavigatorEntry extends Partial<DriverNavigatorProfile> {
  tempId: string;
}

interface DriverNavigatorWizardProps {
  initialDrivers?: DriverNavigatorProfile[];
  initialNavigators?: DriverNavigatorProfile[];
  initialValues?: DriverNavigatorProfile | null;
  activeRole: RoleType;
  isProfileAdded: boolean;
  onSubmit: (data: {
    drivers: Partial<DriverNavigatorProfile>[];
    navigators: Partial<DriverNavigatorProfile>[];
  }) => Promise<boolean | void>;
  onCancel?: () => void;
  loading?: boolean;
}

const TOTAL_STEPS = 6;

const STEP_TITLES = [
  'Personal & Racing Identity',
  'Contact Details',
  'License & Uploads',
  'Emergency & Health',
  'Federation & Insurance',
  'Review & Final Submission',
];

const STEP_ICONS = ['👤', '📱', '🪪', '🆘', '🛡️', '📋'];

const createEmptyDriver = (index: number): DriverNavigatorEntry => ({
  tempId: `driver_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`,
  role_type: 'driver',
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

const createEmptyNavigator = (index: number): DriverNavigatorEntry => ({
  tempId: `navigator_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`,
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

export const DriverNavigatorWizard: React.FC<DriverNavigatorWizardProps> = ({
  initialDrivers,
  initialNavigators,
  initialValues,
  activeRole,
  isProfileAdded: _isProfileAdded,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { draftStep, showRestoredToast, saveDraft, clearDraft } =
    useDriverNavigatorDraft(activeRole, initialValues);

  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    Keyboard.dismiss();
    const timer = setTimeout(() => {
      formContainerRef.current?.scrollTo({ y: 0, animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Dynamic Multi-Entry State
  const [drivers, setDrivers] = useState<DriverNavigatorEntry[]>(() => {
    if (initialDrivers && initialDrivers.length > 0) {
      return initialDrivers.map((d, i) => ({
        ...d,
        tempId: d.id ? String(d.id) : `driver_init_${i}`,
      }));
    }
    if (initialValues && activeRole === 'driver') {
      return [{ ...initialValues, tempId: initialValues.id ? String(initialValues.id) : 'driver_init_0' }];
    }
    return [createEmptyDriver(0)];
  });

  const [navigators, setNavigators] = useState<DriverNavigatorEntry[]>(() => {
    if (initialNavigators && initialNavigators.length > 0) {
      return initialNavigators.map((n, i) => ({
        ...n,
        tempId: n.id ? String(n.id) : `navigator_init_${i}`,
      }));
    }
    if (initialValues && activeRole === 'navigator') {
      return [{ ...initialValues, tempId: initialValues.id ? String(initialValues.id) : 'navigator_init_0' }];
    }
    return [createEmptyNavigator(0)];
  });

  // Files state mapped by `${tempId}_${fieldKey}`
  const [selectedFiles, setSelectedFiles] = useState<Record<string, SelectedFile>>({});
  const [uploadStatus, setUploadStatus] = useState<{
    stepName: string;
    percent: number;
    isUploading: boolean;
  } | null>(null);

  const firstInputRef = useRef<TextInput>(null);
  const formContainerRef = useRef<KeyboardAwareFormContainerRef>(null);

  // Sync initial or draft values
  useEffect(() => {
    if (draftStep && draftStep >= 1 && draftStep <= TOTAL_STEPS) {
      setCurrentStep(draftStep);
    }
  }, [draftStep]);

  // Focus first input of step
  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Multi-entry manipulators
  const addDriver = () => {
    setDrivers((prev) => [...prev, createEmptyDriver(prev.length)]);
  };

  const removeDriver = (index: number) => {
    if (drivers.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one driver entry must be maintained.');
      return;
    }
    Alert.alert('Remove Driver', `Are you sure you want to remove Driver #${index + 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setDrivers((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const addNavigator = () => {
    setNavigators((prev) => [...prev, createEmptyNavigator(prev.length)]);
  };

  const removeNavigator = (index: number) => {
    if (navigators.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one navigator entry must be maintained.');
      return;
    }
    Alert.alert('Remove Navigator', `Are you sure you want to remove Navigator #${index + 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setNavigators((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const updateDriverField = (index: number, key: keyof DriverNavigatorProfile, value: string) => {
    setDrivers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      saveDraft(copy[0], currentStep);
      return copy;
    });
  };

  const updateNavigatorField = (index: number, key: keyof DriverNavigatorProfile, value: string) => {
    setNavigators((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      saveDraft(copy[0], currentStep);
      return copy;
    });
  };

  const handleFileChange = (
    tempId: string,
    key: 'driver_pic_upload' | 'dl_upload' | 'insurance_document',
    fileObj: SelectedFile | null,
    isDriver: boolean,
    index: number
  ) => {
    const fileKey = `${tempId}_${key}`;
    if (fileObj) {
      setSelectedFiles((prev) => ({ ...prev, [fileKey]: fileObj }));
      if (isDriver) updateDriverField(index, key, fileObj.uri);
      else updateNavigatorField(index, key, fileObj.uri);
    } else {
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[fileKey];
        return copy;
      });
      if (isDriver) updateDriverField(index, key, '');
      else updateNavigatorField(index, key, '');
    }
  };

  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100);

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      for (let i = 0; i < drivers.length; i++) {
        if (!drivers[i].full_name || !drivers[i].full_name?.trim()) {
          Alert.alert('Validation Error', `Please enter Full Legal Name for Driver #${i + 1}.`);
          return false;
        }
      }
      for (let i = 0; i < navigators.length; i++) {
        if (!navigators[i].full_name || !navigators[i].full_name?.trim()) {
          Alert.alert('Validation Error', `Please enter Full Legal Name for Navigator #${i + 1}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < TOTAL_STEPS) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        saveDraft(drivers[0] || navigators[0] || {}, nextStep);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveDraft(drivers[0] || navigators[0] || {}, prevStep);
    } else if (onCancel) {
      onCancel();
    }
  };

  const jumpToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= TOTAL_STEPS) {
      setCurrentStep(stepNumber);
      saveDraft(drivers[0] || navigators[0] || {}, stepNumber);
    }
  };

  const handleClearDraftClick = () => {
    Alert.alert(
      'Clear Draft',
      'Are you sure you want to reset all draft changes and clear saved form progress?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Draft',
          style: 'destructive',
          onPress: async () => {
            await clearDraft();
            setDrivers([createEmptyDriver(0)]);
            setNavigators([createEmptyNavigator(0)]);
            setSelectedFiles({});
            Alert.alert('Draft Cleared', 'Draft has been reset.');
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      setUploadStatus({
        stepName: 'Optimizing uploaded media & documents...',
        percent: 10,
        isUploading: true,
      });

      // Compress all attached files
      const processedDrivers = await Promise.all(
        drivers.map(async (driver) => {
          const dCopy = { ...driver };
          const picKey = `${driver.tempId}_driver_pic_upload`;
          const dlKey = `${driver.tempId}_dl_upload`;
          const insKey = `${driver.tempId}_insurance_document`;

          if (selectedFiles[picKey]) {
            const res = await fileCompression.compressImageIfNeeded(selectedFiles[picKey]);
            dCopy.driver_pic_upload = res.file.uri;
          }
          if (selectedFiles[dlKey]) {
            const res = await fileCompression.compressImageIfNeeded(selectedFiles[dlKey]);
            dCopy.dl_upload = res.file.uri;
          }
          if (selectedFiles[insKey]) {
            const res = await fileCompression.compressImageIfNeeded(selectedFiles[insKey]);
            dCopy.insurance_document = res.file.uri;
          }
          return dCopy;
        })
      );

      const processedNavigators = await Promise.all(
        navigators.map(async (nav) => {
          const nCopy = { ...nav };
          const picKey = `${nav.tempId}_driver_pic_upload`;
          const dlKey = `${nav.tempId}_dl_upload`;
          const insKey = `${nav.tempId}_insurance_document`;

          if (selectedFiles[picKey]) {
            const res = await fileCompression.compressImageIfNeeded(selectedFiles[picKey]);
            nCopy.driver_pic_upload = res.file.uri;
          }
          if (selectedFiles[dlKey]) {
            const res = await fileCompression.compressImageIfNeeded(selectedFiles[dlKey]);
            nCopy.dl_upload = res.file.uri;
          }
          if (selectedFiles[insKey]) {
            const res = await fileCompression.compressImageIfNeeded(selectedFiles[insKey]);
            nCopy.insurance_document = res.file.uri;
          }
          return nCopy;
        })
      );

      setUploadStatus({
        stepName: 'Submitting racer profiles...',
        percent: 90,
        isUploading: true,
      });

      await clearDraft();
      await onSubmit({
        drivers: processedDrivers,
        navigators: processedNavigators,
      });

      setUploadStatus(null);
    } catch (err: any) {
      console.warn('[DriverNavigatorWizard] Submission error:', err);
      setUploadStatus(null);
      Alert.alert(
        'Upload & Submission Failed',
        err.message || 'Upload failed. Retry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry Upload', style: 'default', onPress: () => handleSubmit() },
        ]
      );
    }
  };

  const isStepCompleted = (stepNum: number): boolean => {
    if (stepNum === 1) {
      return (
        drivers.every((d) => Boolean(d.full_name && d.full_name.trim())) &&
        navigators.every((n) => Boolean(n.full_name && n.full_name.trim()))
      );
    }
    return true;
  };

  return (
    <View style={styles.keyboardContainer}>
      {/* Toast Notification Banner */}
      {showRestoredToast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastIcon}>⚡</Text>
          <Text style={styles.toastText}>Draft restored from local memory</Text>
        </View>
      )}

      {/* Upload Progress Card */}
      {uploadStatus && uploadStatus.isUploading && (
        <View style={styles.uploadStatusCard}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>⏳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadStatusText}>{uploadStatus.stepName}</Text>
            <View style={styles.uploadProgressBarTrack}>
              <View style={[styles.uploadProgressBarFill, { width: `${uploadStatus.percent}%` }]} />
            </View>
          </View>
          <Text style={styles.uploadPercentText}>{uploadStatus.percent}%</Text>
        </View>
      )}

      {/* Counter Header Bar */}
      <View style={styles.counterBar}>
        <Text style={styles.counterBadgeText}>Drivers Added: {drivers.length}</Text>
        <View style={styles.counterDivider} />
        <Text style={styles.counterBadgeText}>Navigators Added: {navigators.length}</Text>
      </View>

      {/* Wizard Header & Progress Bar */}
      <View style={styles.wizardHeaderCard}>
        <View style={styles.stepCounterRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              Step {currentStep} of {TOTAL_STEPS}
            </Text>
          </View>
          <View style={styles.headerRightActions}>
            <Text style={styles.percentText}>{progressPercent}% Complete</Text>
            <TouchableOpacity style={styles.clearDraftBtn} onPress={handleClearDraftClick}>
              <Text style={styles.clearDraftBtnText}>Clear Draft</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.stepMainTitle}>
          {STEP_ICONS[currentStep - 1]} {STEP_TITLES[currentStep - 1]}
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Step Pills */}
      <View style={styles.pillsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {STEP_TITLES.map((title, index) => {
            const stepNum = index + 1;
            const isActive = currentStep === stepNum;
            const completed = isStepCompleted(stepNum);

            return (
              <TouchableOpacity
                key={stepNum}
                activeOpacity={0.8}
                onPress={() => jumpToStep(stepNum)}
                style={[
                  styles.stepPill,
                  isActive && styles.stepPillActive,
                  completed && !isActive && styles.stepPillCompleted,
                ]}
              >
                <Text style={[styles.pillStepNum, isActive && styles.pillStepNumActive]}>
                  {completed ? '✓' : stepNum}
                </Text>
                <Text
                  style={[
                    styles.pillTitle,
                    isActive && styles.pillTitleActive,
                    completed && !isActive && styles.pillTitleCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Form Content Body */}
      <KeyboardAwareFormContainer
        ref={formContainerRef}
        style={styles.stepScrollContent}
        contentContainerStyle={styles.stepInnerPadding}
        extraScrollHeight={120}
      >
        {/* Step 1: Personal & Racing Identity */}
        {currentStep === 1 && (
          <View style={styles.formSection}>
            {/* Drivers Section */}
            <Text style={styles.roleGroupHeading}>🏎️ DRIVER ENTRIES ({drivers.length})</Text>
            {drivers.map((driver, idx) => (
              <View key={driver.tempId} style={styles.entryCard}>
                <View style={styles.entryCardHeader}>
                  <Text style={styles.entryTitle}>Driver #{idx + 1}</Text>
                  {drivers.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeDriver(idx)}>
                      <Text style={styles.removeBtnText}>[ Remove Driver ]</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <InputField
                  label="Full Legal Name *"
                  placeholder="e.g. Gaurav Singh Thakur"
                  value={driver.full_name || ''}
                  onChangeText={(val) => updateDriverField(idx, 'full_name', val)}
                  icon="👤"
                  required
                />
                <InputField
                  label="Race / Call Sign Nickname"
                  placeholder="e.g. Apex Predator, Maverick"
                  value={driver.race_nick_name || ''}
                  onChangeText={(val) => updateDriverField(idx, 'race_nick_name', val)}
                  icon="🏎️"
                />
                <InputField
                  label="Blood Group"
                  placeholder="e.g. O+, A+, B+, AB-"
                  value={driver.blood_group || ''}
                  onChangeText={(val) => updateDriverField(idx, 'blood_group', val)}
                  icon="🩸"
                />
                <DatePickerInput
                  label="Date of Birth"
                  value={driver.dob || ''}
                  onChangeDate={(val) => updateDriverField(idx, 'dob', val)}
                  icon="🎂"
                  placeholder="Select Date of Birth"
                  minYear={1950}
                  maxYear={2015}
                />
                <InputField
                  label="Country"
                  placeholder="e.g. India"
                  value={driver.country || ''}
                  onChangeText={(val) => updateDriverField(idx, 'country', val)}
                  icon="🌐"
                />
                <InputField
                  label="Gender"
                  placeholder="e.g. Male, Female, Other"
                  value={driver.gender || ''}
                  onChangeText={(val) => updateDriverField(idx, 'gender', val)}
                  icon="⚧️"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addEntryBtn} onPress={addDriver}>
              <Text style={styles.addEntryBtnText}>+ Add Driver</Text>
            </TouchableOpacity>

            {/* Navigators Section */}
            <Text style={[styles.roleGroupHeading, { marginTop: 24 }]}>
              🗺️ NAVIGATOR ENTRIES ({navigators.length})
            </Text>
            {navigators.map((nav, idx) => (
              <View key={nav.tempId} style={styles.entryCard}>
                <View style={styles.entryCardHeader}>
                  <Text style={styles.entryTitle}>Navigator #{idx + 1}</Text>
                  {navigators.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeNavigator(idx)}>
                      <Text style={styles.removeBtnText}>[ Remove Navigator ]</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <InputField
                  label="Full Legal Name *"
                  placeholder="e.g. Carlos Sainz Sr"
                  value={nav.full_name || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'full_name', val)}
                  icon="👤"
                  required
                />
                <InputField
                  label="Race Nickname"
                  placeholder="e.g. Chili"
                  value={nav.race_nick_name || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'race_nick_name', val)}
                  icon="🏎️"
                />
                <InputField
                  label="Blood Group"
                  placeholder="e.g. O+, A+, B+, AB-"
                  value={nav.blood_group || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'blood_group', val)}
                  icon="🩸"
                />
                <DatePickerInput
                  label="Date of Birth"
                  value={nav.dob || ''}
                  onChangeDate={(val) => updateNavigatorField(idx, 'dob', val)}
                  icon="🎂"
                  placeholder="Select Date of Birth"
                  minYear={1950}
                  maxYear={2015}
                />
                <InputField
                  label="Country"
                  placeholder="e.g. India"
                  value={nav.country || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'country', val)}
                  icon="🌐"
                />
                <InputField
                  label="Gender"
                  placeholder="e.g. Male, Female, Other"
                  value={nav.gender || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'gender', val)}
                  icon="⚧️"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addEntryBtn} onPress={addNavigator}>
              <Text style={styles.addEntryBtnText}>+ Add Navigator</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Contact Details */}
        {currentStep === 2 && (
          <View style={styles.formSection}>
            <Text style={styles.roleGroupHeading}>🏎️ DRIVER CONTACT DETAILS</Text>
            {drivers.map((driver, idx) => (
              <View key={driver.tempId} style={styles.entryCard}>
                <Text style={styles.entryTitle}>Driver #{idx + 1}: {driver.full_name || 'Unnamed'}</Text>
                <InputField
                  label="Primary Mobile Number"
                  placeholder="e.g. 9876543210"
                  value={driver.mobile_no || ''}
                  onChangeText={(val) => updateDriverField(idx, 'mobile_no', val)}
                  keyboardType="phone-pad"
                  icon="📱"
                />
                <InputField
                  label="Alternate Contact Number"
                  placeholder="e.g. 9123456789"
                  value={driver.alternate_mobile_no || ''}
                  onChangeText={(val) => updateDriverField(idx, 'alternate_mobile_no', val)}
                  keyboardType="phone-pad"
                  icon="📞"
                />
                <InputField
                  label="Email Address"
                  placeholder="e.g. racer@eagleeye.com"
                  value={driver.email || ''}
                  onChangeText={(val) => updateDriverField(idx, 'email', val)}
                  keyboardType="email-address"
                  icon="✉️"
                />
                <InputField
                  label="Instagram Handle"
                  placeholder="e.g. @gaurav_racing"
                  value={driver.instagram_handle || ''}
                  onChangeText={(val) => updateDriverField(idx, 'instagram_handle', val)}
                  icon="📸"
                />
              </View>
            ))}

            <Text style={[styles.roleGroupHeading, { marginTop: 24 }]}>🗺️ NAVIGATOR CONTACT DETAILS</Text>
            {navigators.map((nav, idx) => (
              <View key={nav.tempId} style={styles.entryCard}>
                <Text style={styles.entryTitle}>Navigator #{idx + 1}: {nav.full_name || 'Unnamed'}</Text>
                <InputField
                  label="Primary Mobile Number"
                  placeholder="e.g. 9876543210"
                  value={nav.mobile_no || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'mobile_no', val)}
                  keyboardType="phone-pad"
                  icon="📱"
                />
                <InputField
                  label="Alternate Contact Number"
                  placeholder="e.g. 9123456789"
                  value={nav.alternate_mobile_no || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'alternate_mobile_no', val)}
                  keyboardType="phone-pad"
                  icon="📞"
                />
                <InputField
                  label="Email Address"
                  placeholder="e.g. navigator@eagleeye.com"
                  value={nav.email || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'email', val)}
                  keyboardType="email-address"
                  icon="✉️"
                />
                <InputField
                  label="Instagram Handle"
                  placeholder="e.g. @navigator_racing"
                  value={nav.instagram_handle || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'instagram_handle', val)}
                  icon="📸"
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 3: License & Uploads */}
        {currentStep === 3 && (
          <View style={styles.formSection}>
            <Text style={styles.roleGroupHeading}>🏎️ DRIVER LICENSES & UPLOADS</Text>
            {drivers.map((driver, idx) => (
              <View key={driver.tempId} style={styles.entryCard}>
                <Text style={styles.entryTitle}>Driver #{idx + 1}: {driver.full_name || 'Unnamed'}</Text>
                <InputField
                  label="Driving License Number"
                  placeholder="e.g. MP092021004589"
                  value={driver.dl_no || ''}
                  onChangeText={(val) => updateDriverField(idx, 'dl_no', val)}
                  icon="🪪"
                />
                <DatePickerInput
                  label="Driving License Validity"
                  value={driver.dl_validity || ''}
                  onChangeDate={(val) => updateDriverField(idx, 'dl_validity', val)}
                  icon="📅"
                  placeholder="Select DL Expiry Date"
                  minYear={2024}
                  maxYear={2045}
                />
                <FileUploadInput
                  label="Driving License Upload (JPG/PNG/PDF)"
                  value={driver.dl_upload}
                  onFileSelected={(fileObj) =>
                    handleFileChange(driver.tempId, 'dl_upload', fileObj, true, idx)
                  }
                  icon="📄"
                />
                <FileUploadInput
                  label="Racer Profile Photo / Avatar"
                  value={driver.driver_pic_upload}
                  onFileSelected={(fileObj) =>
                    handleFileChange(driver.tempId, 'driver_pic_upload', fileObj, true, idx)
                  }
                  icon="📷"
                />
              </View>
            ))}

            <Text style={[styles.roleGroupHeading, { marginTop: 24 }]}>🗺️ NAVIGATOR LICENSES & UPLOADS</Text>
            {navigators.map((nav, idx) => (
              <View key={nav.tempId} style={styles.entryCard}>
                <Text style={styles.entryTitle}>Navigator #{idx + 1}: {nav.full_name || 'Unnamed'}</Text>
                <InputField
                  label="Driving License Number"
                  placeholder="e.g. MP092021004589"
                  value={nav.dl_no || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'dl_no', val)}
                  icon="🪪"
                />
                <DatePickerInput
                  label="Driving License Validity"
                  value={nav.dl_validity || ''}
                  onChangeDate={(val) => updateNavigatorField(idx, 'dl_validity', val)}
                  icon="📅"
                  placeholder="Select DL Expiry Date"
                  minYear={2024}
                  maxYear={2045}
                />
                <FileUploadInput
                  label="Driving License Upload (JPG/PNG/PDF)"
                  value={nav.dl_upload}
                  onFileSelected={(fileObj) =>
                    handleFileChange(nav.tempId, 'dl_upload', fileObj, false, idx)
                  }
                  icon="📄"
                />
                <FileUploadInput
                  label="Racer Profile Photo / Avatar"
                  value={nav.driver_pic_upload}
                  onFileSelected={(fileObj) =>
                    handleFileChange(nav.tempId, 'driver_pic_upload', fileObj, false, idx)
                  }
                  icon="📷"
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 4: Emergency & Health */}
        {currentStep === 4 && (
          <View style={styles.formSection}>
            <Text style={styles.roleGroupHeading}>🏎️ DRIVER EMERGENCY DETAILS</Text>
            {drivers.map((driver, idx) => (
              <View key={driver.tempId} style={styles.entryCard}>
                <Text style={styles.entryTitle}>Driver #{idx + 1}: {driver.full_name || 'Unnamed'}</Text>
                <InputField
                  label="Emergency Contact Person"
                  placeholder="e.g. Rajesh Thakur"
                  value={driver.emergency_contact_name || ''}
                  onChangeText={(val) => updateDriverField(idx, 'emergency_contact_name', val)}
                  icon="🆘"
                />
                <InputField
                  label="Emergency Contact Phone"
                  placeholder="e.g. 9826012345"
                  value={driver.emergency_contact_no || ''}
                  onChangeText={(val) => updateDriverField(idx, 'emergency_contact_no', val)}
                  keyboardType="phone-pad"
                  icon="📞"
                />
                <InputField
                  label="Relationship"
                  placeholder="e.g. Father, Spouse, Team Manager"
                  value={driver.relation || ''}
                  onChangeText={(val) => updateDriverField(idx, 'relation', val)}
                  icon="👥"
                />
                <InputField
                  label="Race Suit T-Shirt Size"
                  placeholder="e.g. S, M, L, XL, XXL"
                  value={driver.t_shirt_size || ''}
                  onChangeText={(val) => updateDriverField(idx, 't_shirt_size', val)}
                  icon="👕"
                />
                <InputField
                  label="Medical Conditions / Allergies"
                  placeholder="e.g. None, Asthma, Penicillin Allergy"
                  value={driver.medical_condition || ''}
                  onChangeText={(val) => updateDriverField(idx, 'medical_condition', val)}
                  multiline
                  numberOfLines={3}
                  icon="🏥"
                />
              </View>
            ))}

            <Text style={[styles.roleGroupHeading, { marginTop: 24 }]}>🗺️ NAVIGATOR EMERGENCY DETAILS</Text>
            {navigators.map((nav, idx) => (
              <View key={nav.tempId} style={styles.entryCard}>
                <Text style={styles.entryTitle}>Navigator #{idx + 1}: {nav.full_name || 'Unnamed'}</Text>
                <InputField
                  label="Emergency Contact Person"
                  placeholder="e.g. Suresh Sainz"
                  value={nav.emergency_contact_name || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'emergency_contact_name', val)}
                  icon="🆘"
                />
                <InputField
                  label="Emergency Contact Phone"
                  placeholder="e.g. 9826012345"
                  value={nav.emergency_contact_no || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'emergency_contact_no', val)}
                  keyboardType="phone-pad"
                  icon="📞"
                />
                <InputField
                  label="Relationship"
                  placeholder="e.g. Father, Spouse, Team Manager"
                  value={nav.relation || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'relation', val)}
                  icon="👥"
                />
                <InputField
                  label="Race Suit T-Shirt Size"
                  placeholder="e.g. S, M, L, XL, XXL"
                  value={nav.t_shirt_size || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 't_shirt_size', val)}
                  icon="👕"
                />
                <InputField
                  label="Medical Conditions / Allergies"
                  placeholder="e.g. None, Asthma"
                  value={nav.medical_condition || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'medical_condition', val)}
                  multiline
                  numberOfLines={3}
                  icon="🏥"
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 5: Federation & Insurance */}
        {currentStep === 5 && (
          <View style={styles.formSection}>
            <Text style={styles.roleGroupHeading}>🏎️ DRIVER FEDERATION & INSURANCE</Text>
            {drivers.map((driver, idx) => (
              <View key={driver.tempId} style={styles.entryCard}>
                <Text style={styles.entryTitle}>Driver #{idx + 1}: {driver.full_name || 'Unnamed'}</Text>
                <InputField
                  label="ASN / FMN Competition License"
                  placeholder="e.g. FMSC-2026-9812"
                  value={driver.asn_fmn_lic || ''}
                  onChangeText={(val) => updateDriverField(idx, 'asn_fmn_lic', val)}
                  icon="🏁"
                />
                <InputField
                  label="Motorsport Insurance Policy No"
                  placeholder="e.g. HDFC-RACE-884920"
                  value={driver.insurance_no || ''}
                  onChangeText={(val) => updateDriverField(idx, 'insurance_no', val)}
                  icon="🛡️"
                />
                <DatePickerInput
                  label="Insurance Expiry Date"
                  value={driver.insurance_validity || ''}
                  onChangeDate={(val) => updateDriverField(idx, 'insurance_validity', val)}
                  icon="📆"
                  placeholder="Select Insurance Expiry Date"
                  minYear={2024}
                  maxYear={2035}
                />
                <FileUploadInput
                  label="Insurance Document Upload (JPG/PNG/PDF)"
                  value={driver.insurance_document}
                  onFileSelected={(fileObj) =>
                    handleFileChange(driver.tempId, 'insurance_document', fileObj, true, idx)
                  }
                  icon="📄"
                />
              </View>
            ))}

            <Text style={[styles.roleGroupHeading, { marginTop: 24 }]}>🗺️ NAVIGATOR FEDERATION & INSURANCE</Text>
            {navigators.map((nav, idx) => (
              <View key={nav.tempId} style={styles.entryCard}>
                <Text style={styles.entryTitle}>Navigator #{idx + 1}: {nav.full_name || 'Unnamed'}</Text>
                <InputField
                  label="ASN / FMN Competition License"
                  placeholder="e.g. FMSC-2026-9812"
                  value={nav.asn_fmn_lic || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'asn_fmn_lic', val)}
                  icon="🏁"
                />
                <InputField
                  label="Motorsport Insurance Policy No"
                  placeholder="e.g. HDFC-RACE-884920"
                  value={nav.insurance_no || ''}
                  onChangeText={(val) => updateNavigatorField(idx, 'insurance_no', val)}
                  icon="🛡️"
                />
                <DatePickerInput
                  label="Insurance Expiry Date"
                  value={nav.insurance_validity || ''}
                  onChangeDate={(val) => updateNavigatorField(idx, 'insurance_validity', val)}
                  icon="📆"
                  placeholder="Select Insurance Expiry Date"
                  minYear={2024}
                  maxYear={2035}
                />
                <FileUploadInput
                  label="Insurance Document Upload (JPG/PNG/PDF)"
                  value={nav.insurance_document}
                  onFileSelected={(fileObj) =>
                    handleFileChange(nav.tempId, 'insurance_document', fileObj, false, idx)
                  }
                  icon="📄"
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 6: Review & Final Submission */}
        {currentStep === 6 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewHeading}>Review All Racer Profiles ({drivers.length + navigators.length})</Text>

            {drivers.map((driver, idx) => (
              <View key={driver.tempId} style={styles.summaryCard}>
                <View style={styles.summaryHeaderRow}>
                  <Text style={styles.summaryTitle}>🏎️ Driver #{idx + 1}: {driver.full_name || 'N/A'}</Text>
                  <TouchableOpacity onPress={() => jumpToStep(1)}>
                    <Text style={styles.editJumpBtn}>Edit ✏️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.summaryRowText}>Nickname: {driver.race_nick_name || 'N/A'}</Text>
                <Text style={styles.summaryRowText}>Mobile: {driver.mobile_no || 'N/A'}</Text>
                <Text style={styles.summaryRowText}>Email: {driver.email || 'N/A'}</Text>
                <Text style={styles.summaryRowText}>DL No: {driver.dl_no || 'N/A'}</Text>
                <Text style={styles.summaryRowText}>ASN License: {driver.asn_fmn_lic || 'N/A'}</Text>
              </View>
            ))}

            {navigators.map((nav, idx) => (
              <View key={nav.tempId} style={styles.summaryCard}>
                <View style={styles.summaryHeaderRow}>
                  <Text style={styles.summaryTitle}>🗺️ Navigator #{idx + 1}: {nav.full_name || 'N/A'}</Text>
                  <TouchableOpacity onPress={() => jumpToStep(1)}>
                    <Text style={styles.editJumpBtn}>Edit ✏️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.summaryRowText}>Nickname: {nav.race_nick_name || 'N/A'}</Text>
                <Text style={styles.summaryRowText}>Mobile: {nav.mobile_no || 'N/A'}</Text>
                <Text style={styles.summaryRowText}>Email: {nav.email || 'N/A'}</Text>
                <Text style={styles.summaryRowText}>DL No: {nav.dl_no || 'N/A'}</Text>
                <Text style={styles.summaryRowText}>ASN License: {nav.asn_fmn_lic || 'N/A'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Step Action Buttons (Natural Scrollable Form End) */}
        <View style={styles.formFooterCard}>
          <View style={styles.footerBtnGroup}>
            <View style={styles.footerBackWrapper}>
              <SecondaryButton title={currentStep === 1 ? 'Cancel' : 'Back'} onPress={handleBack} disabled={loading} />
            </View>
            <View style={styles.footerNextWrapper}>
              {currentStep < TOTAL_STEPS ? (
                <PrimaryButton title="Next Step →" onPress={handleNext} disabled={loading} />
              ) : (
                <PrimaryButton
                  title={loading ? 'Submitting...' : 'Submit Racer Profiles 🏁'}
                  onPress={handleSubmit}
                  loading={loading}
                />
              )}
            </View>
          </View>
        </View>
      </KeyboardAwareFormContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  counterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  counterBadgeText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '800',
  },
  counterDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.surfaceBorder,
    marginHorizontal: 16,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
  },
  toastIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toastText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  uploadStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FF7A00',
  },
  uploadStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadProgressBarTrack: {
    height: 6,
    backgroundColor: '#1F1F1F',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  uploadProgressBarFill: {
    height: '100%',
    backgroundColor: '#FF7A00',
    borderRadius: 3,
  },
  uploadPercentText: {
    color: '#FF7A00',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 12,
  },
  wizardHeaderCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  stepCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepBadge: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  stepBadgeText: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percentText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  clearDraftBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearDraftBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  stepMainTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  pillsContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  stepPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  stepPillCompleted: {
    borderColor: COLORS.primary,
  },
  pillStepNum: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },
  pillStepNumActive: {
    color: COLORS.white,
  },
  pillTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTitleActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  pillTitleCompleted: {
    color: COLORS.primaryLight,
  },
  stepScrollContent: {
    flex: 1,
  },
  stepInnerPadding: {
    padding: 16,
    paddingBottom: 24,
  },
  formSection: {
    gap: 4,
  },
  roleGroupHeading: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  entryCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 14,
    gap: 4,
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  entryTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  removeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  addEntryBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addEntryBtnText: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewSection: {
    gap: 12,
  },
  reviewHeading: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  summaryTitle: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '800',
  },
  editJumpBtn: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryRowText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  formFooterCard: {
    marginTop: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  footerBtnGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  footerBackWrapper: {
    flex: 1,
  },
  footerNextWrapper: {
    flex: 2,
  },
});
