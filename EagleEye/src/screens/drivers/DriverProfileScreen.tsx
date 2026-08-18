import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header, InputField, PrimaryButton, KeyboardAwareFormContainer, FileUploadInput } from '@/components';
import { profileService, UserProfile } from '@/services/profileService';
import { SelectedFile } from '@/utils/fileValidation';
import { getUserAvatarUrl } from '@/utils/fileUrl';

const STATS = [
  { label: 'Events', value: '42', icon: '🏁' },
  { label: 'Wins', value: '18', icon: '🏆' },
  { label: 'Podiums', value: '29', icon: '🥇' },
  { label: 'Experience', value: '7 Yrs', icon: '⚡' },
];

export const DriverProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [selectedProfilePic, setSelectedProfilePic] = useState<SelectedFile | null>(null);

  const fetchProfile = async () => {
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
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const res = await profileService.updateUserProfile({
        name: editName,
        contact: editContact,
        address: editAddress,
        city: editCity,
        state: editState,
        pincode: editPincode,
        profile_pic_file: selectedProfilePic,
      });

      Alert.alert('Success', res.message || 'Profile updated successfully.');
      if (res && res.user) {
        setProfile(res.user);
      }
      setSelectedProfilePic(null);
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.log('Update Profile Error:', error?.response?.data || error.message);
      Alert.alert('Update Failed', error?.response?.data?.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  const avatarDisplayUri = getUserAvatarUrl(
    profile?.profile_pic_url,
    profile?.profile_pic_path
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
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
            onPress={() => setIsEditModalOpen(true)}
          >
            <Image
              source={{ uri: avatarDisplayUri }}
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

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="slide" onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAwareFormContainer style={styles.modalScroll}>
              <FileUploadInput
                label="Profile Photo (JPG / PNG)"
                value={selectedProfilePic?.uri || profile?.profile_pic_url || profile?.profile_pic_path}
                onFileSelected={(file: SelectedFile | null) => setSelectedProfilePic(file)}
                icon="📷"
              />
              <InputField label="Name" placeholder="Full name" value={editName} onChangeText={setEditName} icon="👤" />
              <InputField label="Contact" placeholder="Phone number" value={editContact} onChangeText={setEditContact} icon="📱" keyboardType="phone-pad" />
              <InputField label="Address" placeholder="Street address" value={editAddress} onChangeText={setEditAddress} icon="📍" />
              <InputField label="City" placeholder="City" value={editCity} onChangeText={setEditCity} icon="🏙️" />
              <InputField label="State" placeholder="State" value={editState} onChangeText={setEditState} icon="🗺️" />
              <InputField label="Pincode" placeholder="Pincode" value={editPincode} onChangeText={setEditPincode} icon="📮" keyboardType="number-pad" />

              <PrimaryButton title={loading ? "Saving..." : "Save Profile"} icon="💾" onPress={handleUpdateProfile} disabled={loading} style={styles.saveBtn} />
            </KeyboardAwareFormContainer>
          </View>
        </View>
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
    paddingBottom: 24,
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
  },
  cameraOverlayBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 12,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  closeText: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontWeight: 'bold',
    padding: 4,
  },
  modalScroll: {
    paddingBottom: 20,
  },
  saveBtn: {
    marginTop: 14,
    marginBottom: 20,
  },
});
