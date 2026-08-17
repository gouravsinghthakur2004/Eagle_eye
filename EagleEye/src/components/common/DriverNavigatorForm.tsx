import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { InputField } from '../forms/InputField';
import { PrimaryButton } from './PrimaryButton';
import { DriverNavigatorProfile } from '@/types';
import { RoleType } from '@/hooks/useDriverNavigatorProfile';

interface DriverNavigatorFormProps {
  initialValues?: DriverNavigatorProfile | null;
  activeRole: RoleType;
  isProfileAdded: boolean;
  onSubmit: (formData: Partial<DriverNavigatorProfile>) => Promise<boolean | void>;
  loading?: boolean;
}

export const DriverNavigatorForm: React.FC<DriverNavigatorFormProps> = ({
  initialValues,
  activeRole,
  isProfileAdded,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<DriverNavigatorProfile>>({
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

  // Auto-fill form when initialValues change or role changes
  useEffect(() => {
    if (initialValues) {
      setFormData({
        full_name: initialValues.full_name || '',
        race_nick_name: initialValues.race_nick_name || '',
        blood_group: initialValues.blood_group || '',
        dob: initialValues.dob || '',
        country: initialValues.country || '',
        gender: initialValues.gender || '',
        mobile_no: initialValues.mobile_no || '',
        alternate_mobile_no: initialValues.alternate_mobile_no || '',
        email: initialValues.email || '',
        dl_no: initialValues.dl_no || '',
        dl_validity: initialValues.dl_validity || '',
        dl_upload: initialValues.dl_upload || '',
        driver_pic_upload: initialValues.driver_pic_upload || '',
        instagram_handle: initialValues.instagram_handle || '',
        emergency_contact_name: initialValues.emergency_contact_name || '',
        emergency_contact_no: initialValues.emergency_contact_no || '',
        relation: initialValues.relation || '',
        t_shirt_size: initialValues.t_shirt_size || '',
        asn_fmn_lic: initialValues.asn_fmn_lic || '',
        insurance_no: initialValues.insurance_no || '',
        insurance_document: initialValues.insurance_document || '',
        insurance_validity: initialValues.insurance_validity || '',
        medical_condition: initialValues.medical_condition || '',
      });
    } else {
      // Reset form for fresh role profile creation
      setFormData({
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
  }, [initialValues, activeRole]);

  const handleChange = (key: keyof DriverNavigatorProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const roleLabel = activeRole === 'driver' ? 'Driver' : 'Navigator';
  const buttonTitle = isProfileAdded ? `Update ${roleLabel}` : `Save ${roleLabel}`;

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <View style={styles.container}>
      {/* Card 1: Personal & Racing Identity */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderIcon}>{activeRole === 'driver' ? '🏎️' : '🗺️'}</Text>
          <Text style={styles.cardTitle}>{roleLabel} Personal Details</Text>
        </View>

        <InputField
          label="Full Name *"
          placeholder="e.g. Carlos Sainz"
          value={formData.full_name || ''}
          onChangeText={(v) => handleChange('full_name', v)}
          icon="👤"
        />

        <InputField
          label="Race Nickname"
          placeholder="e.g. Chili / The Navigator"
          value={formData.race_nick_name || ''}
          onChangeText={(v) => handleChange('race_nick_name', v)}
          icon="🏎️"
        />

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <InputField
              label="Gender"
              placeholder="e.g. Male / Female"
              value={formData.gender || ''}
              onChangeText={(v) => handleChange('gender', v)}
              icon="🚻"
            />
          </View>
          <View style={styles.halfCol}>
            <InputField
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={formData.dob || ''}
              onChangeText={(v) => handleChange('dob', v)}
              icon="📅"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <InputField
              label="Country"
              placeholder="e.g. Spain / India"
              value={formData.country || ''}
              onChangeText={(v) => handleChange('country', v)}
              icon="🌍"
            />
          </View>
          <View style={styles.halfCol}>
            <InputField
              label="Blood Group"
              placeholder="e.g. O+, A-, B+"
              value={formData.blood_group || ''}
              onChangeText={(v) => handleChange('blood_group', v)}
              icon="🩸"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <InputField
              label="T-Shirt Size"
              placeholder="e.g. S, M, L, XL"
              value={formData.t_shirt_size || ''}
              onChangeText={(v) => handleChange('t_shirt_size', v)}
              icon="👕"
            />
          </View>
          <View style={styles.halfCol}>
            <InputField
              label="Instagram Handle"
              placeholder="@username"
              value={formData.instagram_handle || ''}
              onChangeText={(v) => handleChange('instagram_handle', v)}
              icon="📸"
            />
          </View>
        </View>
      </View>

      {/* Card 2: Contact Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderIcon}>📱</Text>
          <Text style={styles.cardTitle}>Contact Details</Text>
        </View>

        <InputField
          label="Email Address"
          placeholder="e.g. racer@motorsports.com"
          value={formData.email || ''}
          onChangeText={(v) => handleChange('email', v)}
          icon="✉️"
          keyboardType="email-address"
        />

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <InputField
              label="Mobile Number"
              placeholder="+91 9876543210"
              value={formData.mobile_no || ''}
              onChangeText={(v) => handleChange('mobile_no', v)}
              icon="📞"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.halfCol}>
            <InputField
              label="Alt Mobile No"
              placeholder="+91 9876543211"
              value={formData.alternate_mobile_no || ''}
              onChangeText={(v) => handleChange('alternate_mobile_no', v)}
              icon="☎️"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>

      {/* Card 3: Driving License & Photo Uploads */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderIcon}>🪪</Text>
          <Text style={styles.cardTitle}>License & Photo Uploads</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <InputField
              label="DL Number"
              placeholder="e.g. DL-14201100123"
              value={formData.dl_no || ''}
              onChangeText={(v) => handleChange('dl_no', v)}
              icon="💳"
            />
          </View>
          <View style={styles.halfCol}>
            <InputField
              label="DL Expiry Date"
              placeholder="YYYY-MM-DD"
              value={formData.dl_validity || ''}
              onChangeText={(v) => handleChange('dl_validity', v)}
              icon="📅"
            />
          </View>
        </View>

        <InputField
          label="DL Upload Path / URL"
          placeholder="e.g. uploads/documents/dl.pdf"
          value={formData.dl_upload || ''}
          onChangeText={(v) => handleChange('dl_upload', v)}
          icon="📄"
        />

        <InputField
          label={`${roleLabel} Photo URL`}
          placeholder="e.g. uploads/photos/avatar.jpg"
          value={formData.driver_pic_upload || ''}
          onChangeText={(v) => handleChange('driver_pic_upload', v)}
          icon="🖼️"
        />
      </View>

      {/* Card 4: Emergency Contact & Medical Condition */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderIcon}>🆘</Text>
          <Text style={styles.cardTitle}>Emergency Contact & Health</Text>
        </View>

        <InputField
          label="Emergency Contact Person"
          placeholder="e.g. Maria Sainz"
          value={formData.emergency_contact_name || ''}
          onChangeText={(v) => handleChange('emergency_contact_name', v)}
          icon="🚨"
        />

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <InputField
              label="Emergency Phone"
              placeholder="+91 9988776655"
              value={formData.emergency_contact_no || ''}
              onChangeText={(v) => handleChange('emergency_contact_no', v)}
              icon="📞"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.halfCol}>
            <InputField
              label="Relationship"
              placeholder="e.g. Spouse / Parent"
              value={formData.relation || ''}
              onChangeText={(v) => handleChange('relation', v)}
              icon="👥"
            />
          </View>
        </View>

        <InputField
          label="Medical Condition / Allergies"
          placeholder="e.g. None / Asthma / Penicillin allergy"
          value={formData.medical_condition || ''}
          onChangeText={(v) => handleChange('medical_condition', v)}
          icon="🏥"
        />
      </View>

      {/* Card 5: ASN Federation & Insurance */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderIcon}>🛡️</Text>
          <Text style={styles.cardTitle}>ASN License & Insurance</Text>
        </View>

        <InputField
          label="ASN / FMN Competition License"
          placeholder="e.g. FMSC-2026-9988"
          value={formData.asn_fmn_lic || ''}
          onChangeText={(v) => handleChange('asn_fmn_lic', v)}
          icon="🏎️"
        />

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <InputField
              label="Insurance Policy No"
              placeholder="e.g. POL-9948201"
              value={formData.insurance_no || ''}
              onChangeText={(v) => handleChange('insurance_no', v)}
              icon="📜"
            />
          </View>
          <View style={styles.halfCol}>
            <InputField
              label="Insurance Validity"
              placeholder="YYYY-MM-DD"
              value={formData.insurance_validity || ''}
              onChangeText={(v) => handleChange('insurance_validity', v)}
              icon="📅"
            />
          </View>
        </View>

        <InputField
          label="Insurance Document URL"
          placeholder="e.g. uploads/documents/insurance.pdf"
          value={formData.insurance_document || ''}
          onChangeText={(v) => handleChange('insurance_document', v)}
          icon="📑"
        />
      </View>

      {/* Dynamic Action Button */}
      <PrimaryButton
        title={loading ? "Saving Profile..." : buttonTitle}
        icon="💾"
        onPress={handleSubmit}
        disabled={loading}
        style={styles.submitBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  cardHeaderIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
});
