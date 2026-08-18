import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '@/theme/colors';
import { Header, InputField, PrimaryButton, SecondaryButton } from '@/components';
import { profileService, UserProfile } from '@/services/profileService';
import { SelectedFile, fileValidation } from '@/utils/fileValidation';
import { fileCompression } from '@/utils/fileCompression';
import { getUserAvatarUrl, FALLBACK_AVATAR } from '@/utils/fileUrl';
import { useAppNavigation } from '@/context/NavigationContext';

const STATS = [
  { label: 'Events', value: '42', icon: '🏁' },
  { label: 'Wins', value: '18', icon: '🏆' },
  { label: 'Podiums', value: '29', icon: '🥇' },
  { label: 'Experience', value: '7 Yrs', icon: '⚡' },
];

const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'EagleEye requires camera access to take profile photos.',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[Permissions] Camera error:', err);
    return false;
  }
};

export const DriverProfileScreen: React.FC = () => {
  const { refreshProfile: refreshGlobalProfile } = useAppNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [selectedProfilePic, setSelectedProfilePic] = useState<SelectedFile | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await profileService.getUserProfile();
      if (res && res.user) {
        setProfile(res.user);
        setEditName(res.user.name || '');
        setEditContact(res.user.contact || '');
        setEditAddress(res.user.address || '');
        setEditCity(res.user.city || '');
        setEditState(res.user.state || '');
        setEditPincode(res.user.pincode || '');
      }
    } catch (error: any) {
      console.log('Fetch Profile Error:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const processAndSetImage = async (rawFile: SelectedFile) => {
    const validation = fileValidation.validateFile(rawFile);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error || 'Invalid image file.');
      return;
    }
    const { file: processedFile } = await fileCompression.compressImageIfNeeded(rawFile);
    setSelectedProfilePic(processedFile);
  };

  const handlePickFromCamera = async () => {
    const hasPerm = await requestCameraPermission();
    if (!hasPerm) {
      Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        saveToPhotos: false,
      },
      async (res) => {
        if (res.didCancel || res.errorCode) return;
        const asset = res.assets?.[0];
        if (asset && asset.uri) {
          await processAndSetImage({
            uri: asset.uri,
            name: asset.fileName || `avatar_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            size: asset.fileSize || 500000,
          });
        }
      }
    );
  };

  const handlePickFromGallery = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        selectionLimit: 1,
      },
      async (res) => {
        if (res.didCancel || res.errorCode) return;
        const asset = res.assets?.[0];
        if (asset && asset.uri) {
          await processAndSetImage({
            uri: asset.uri,
            name: asset.fileName || `avatar_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            size: asset.fileSize || 500000,
          });
        }
      }
    );
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option to update your profile photo:',
      [
        {
          text: 'Take Photo 📷',
          onPress: handlePickFromCamera,
        },
        {
          text: 'Choose from Gallery 🖼️',
          onPress: handlePickFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDirectAvatarPress = () => {
    Alert.alert(
      'Update Profile Photo',
      'Would you like to change your profile photo?',
      [
        {
          text: 'Take Photo 📷',
          onPress: async () => {
            await handlePickFromCamera();
            setIsEditModalOpen(true);
          },
        },
        {
          text: 'Choose from Gallery 🖼️',
          onPress: async () => {
            await handlePickFromGallery();
            setIsEditModalOpen(true);
          },
        },
        {
          text: 'Edit Full Profile ✏️',
          onPress: () => setIsEditModalOpen(true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const res = await profileService.updateUserProfile({
        name: editName.trim(),
        contact: editContact.trim(),
        address: editAddress.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        pincode: editPincode.trim(),
        profile_pic_file: selectedProfilePic,
      });

      Alert.alert('Success', res.message || 'Profile updated successfully.');
      if (res && res.user) {
        setProfile(res.user);
      }
      setSelectedProfilePic(null);
      setIsEditModalOpen(false);
      refreshGlobalProfile();
    } catch (error: any) {
      console.log('Update Profile Error:', error?.response?.data || error.message);
      Alert.alert('Update Failed', error?.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const avatarDisplayUri = getUserAvatarUrl(
    profile?.profile_pic_url,
    profile?.profile_pic_path
  );

  const previewAvatarUri = selectedProfilePic?.uri || avatarDisplayUri;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Driver Profile" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80',
            }}
            style={styles.coverImage}
          />
          <View style={styles.coverOverlay} />
        </View>

        {/* Profile Info Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.85}
            onPress={handleDirectAvatarPress}
          >
            <Image
              source={{ uri: avatarDisplayUri || FALLBACK_AVATAR }}
              style={styles.avatar}
            />
            <View style={styles.cameraOverlayBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>#{profile?.id || '1'}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.driverName}>{profile?.name || profile?.username || 'Racer'}</Text>
          <Text style={styles.categoryText}>@{profile?.username || 'driver'} • {profile?.email || 'N/A'}</Text>

          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditModalOpen(true)}>
            <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Real Profile Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Profile Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{profile?.name || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏷️</Text>
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>{profile?.username || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉️</Text>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{profile?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📱</Text>
            <Text style={styles.infoLabel}>Contact:</Text>
            <Text style={styles.infoValue}>{profile?.contact || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{profile?.address || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏙️</Text>
            <Text style={styles.infoLabel}>City/State:</Text>
            <Text style={styles.infoValue}>
              {profile?.city ? `${profile.city}, ${profile.state || ''} (${profile.pincode || ''})` : 'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Full Responsive Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setSelectedProfilePic(null);
                setIsEditModalOpen(false);
              }}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Scroll Content */}
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Selection Section */}
            <View style={styles.modalAvatarSection}>
              <TouchableOpacity
                style={styles.modalAvatarWrapper}
                onPress={showImagePickerOptions}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: previewAvatarUri || FALLBACK_AVATAR }}
                  style={styles.modalAvatarImage}
                />
                <View style={styles.modalCameraBadge}>
                  <Text style={styles.modalCameraIcon}>📷</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={showImagePickerOptions}
              >
                <Text style={styles.changePhotoText}>
                  {selectedProfilePic ? '✓ Photo Selected (Tap to change)' : 'Tap to Change Photo'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Editable Fields */}
            <InputField
              label="Full Name"
              placeholder="e.g. John Doe"
              value={editName}
              onChangeText={setEditName}
              icon="👤"
            />

            <InputField
              label="Contact Number"
              placeholder="e.g. 9876543210"
              value={editContact}
              onChangeText={setEditContact}
              icon="📱"
              keyboardType="phone-pad"
            />

            <InputField
              label="Street Address"
              placeholder="e.g. 123 Paddock Lane"
              value={editAddress}
              onChangeText={setEditAddress}
              icon="📍"
            />

            <InputField
              label="City"
              placeholder="e.g. Indore"
              value={editCity}
              onChangeText={setEditCity}
              icon="🏙️"
            />

            <InputField
              label="State"
              placeholder="e.g. Madhya Pradesh"
              value={editState}
              onChangeText={setEditState}
              icon="🗺️"
            />

            <InputField
              label="Pincode"
              placeholder="e.g. 452001"
              value={editPincode}
              onChangeText={setEditPincode}
              icon="📮"
              keyboardType="number-pad"
            />

            {/* Action Buttons */}
            <View style={styles.modalActionButtons}>
              <PrimaryButton
                title={saving ? "Saving Changes..." : "Save Profile"}
                icon="💾"
                onPress={handleUpdateProfile}
                disabled={saving}
                style={styles.saveSubmitBtn}
              />
              <SecondaryButton
                title="Cancel"
                onPress={() => {
                  setSelectedProfilePic(null);
                  setIsEditModalOpen(false);
                }}
                style={styles.cancelBtn}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  coverContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.surface,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 11, 11, 0.4)',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  cameraOverlayBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 14,
  },
  numberBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  numberText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  driverName: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  categoryText: {
    color: COLORS.accentOrange,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  editBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  editBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    width: 85,
  },
  infoValue: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  modalTopTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalCloseText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  modalAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  modalCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  modalCameraIcon: {
    fontSize: 14,
  },
  changePhotoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalActionButtons: {
    marginTop: 20,
    gap: 12,
  },
  saveSubmitBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
  },
});
