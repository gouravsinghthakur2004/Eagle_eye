import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { EventItem } from '@/types';
import { formatDate } from '@/utils/dateFormatter';
import { getEventStatusInfo } from '@/utils/eventLifecycle';

interface EventCardProps {
  event: EventItem;
  isJoined?: boolean;
  onViewDetails?: (event: EventItem) => void;
  onResults?: (event: EventItem) => void;
  onJoinEvent?: (event: EventItem) => void;
  cardWidth?: number | string;
  style?: any;
}

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80';

const formatDateOnly = (dateStr?: string | null): string => {
  if (!dateStr || dateStr.trim() === '') return 'N/A';
  return formatDate(dateStr);
};


export const EventCard: React.FC<EventCardProps> = ({
  event,
  isJoined = false,
  onViewDetails,
  onResults,
  onJoinEvent,
  cardWidth,
  style,
}) => {
  const [isContactModalVisible, setContactModalVisible] = useState(false);

  // 1. Resolve Event Image URL with fallback handling
  const getInitialImageUri = () => {
    if (!event.event_pic || event.event_pic.trim() === '') return DEFAULT_FALLBACK_IMAGE;
    if (event.event_pic.startsWith('http://') || event.event_pic.startsWith('https://')) {
      return event.event_pic;
    }
    const cleanPath = event.event_pic.replace(/^\//, '');
    return `https://eagleeyeofficial.com/demo/${cleanPath}`;
  };

  const [imageUri, setImageUri] = useState<string>(getInitialImageUri());
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageUri(DEFAULT_FALLBACK_IMAGE);
    }
  };

  // Resolve SR & Indemnity paths independently
  const srPath = event.sr_path || null;
  const indemnityPath = event.indeminity_path || event.indemnity_path || null;

  // Handle Document Opening
  const openDocument = (path: string | null, docName: string) => {
    if (!path) {
      Alert.alert('Unavailable', `${docName} document is not available for this event.`);
      return;
    }
    const fullUrl = path.startsWith('http') ? path : `https://eagleeyeofficial.com/demo/${path}`;
    Linking.openURL(fullUrl).catch(() => {
      Alert.alert('Error', `Could not open ${docName} document link.`);
    });
  };

  // Handle Navigation to Venue via Google Maps / Apple Maps
  const handleNavigateToVenue = () => {
    if (!event.venue_url) return;
    Linking.openURL(event.venue_url).catch(() => {
      Alert.alert('Error', 'Could not open venue map location.');
    });
  };

  // Handle Phone Call & WhatsApp
  const organizerPhone = event.event_organizer_no || '';
  const cleanPhone = organizerPhone.replace(/[^0-9]/g, '');

  const handleCall = () => {
    setContactModalVisible(false);
    if (!cleanPhone) {
      Alert.alert('Unavailable', 'Organizer contact number is not available.');
      return;
    }
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Could not make phone call.');
    });
  };

  const handleWhatsApp = () => {
    setContactModalVisible(false);
    if (!cleanPhone) {
      Alert.alert('Unavailable', 'Organizer WhatsApp contact is not available.');
      return;
    }
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp app or link.');
    });
  };

  const statusInfo = getEventStatusInfo(event.event_start_date, event.event_end_date, event.result_published);

  return (
    <View style={[styles.card, cardWidth ? { width: cardWidth, marginRight: 14 } : null, style]}>
      {/* 1. Event Image (Clickable for View Details) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onViewDetails && onViewDetails(event)}
        style={styles.imageContainer}
      >
        {imageLoading && (
          <View style={styles.imageLoaderContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
        <Image
          source={{ uri: imageUri }}
          style={styles.heroImage}
          resizeMode="cover"
          onLoadEnd={() => setImageLoading(false)}
          onError={handleImageError}
        />
        {/* Dynamic Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusInfo.badgeBg,
              borderColor: statusInfo.badgeBorder,
            },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: statusInfo.badgeTextColor }]}>
            {statusInfo.label}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* 2. Event Name (Clickable for View Details) */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => onViewDetails && onViewDetails(event)}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.event_name}</Text>
        </TouchableOpacity>

        {/* 3 & 4. Combined Single-Row Horizontal Date Chips */}
        <View style={styles.dateChipsBlock}>
          <View style={styles.dateChip}>
            <Text style={styles.dateChipIcon}>⏱️</Text>
            <Text style={styles.dateChipLabel}>Start: </Text>
            <Text style={styles.dateChipValue}>{formatDateOnly(event.event_start_date)}</Text>
          </View>

          <View style={styles.dateChip}>
            <Text style={styles.dateChipIcon}>🏁</Text>
            <Text style={styles.dateChipLabel}>End: </Text>
            <Text style={styles.dateChipValue}>{formatDateOnly(event.event_end_date)}</Text>
          </View>
        </View>

        {/* 5. Venue + Navigate to Venue */}
        <View style={styles.venueContainer}>
          <View style={styles.venueRow}>
            <View style={styles.pinIconBg}>
              <Text style={styles.pinIcon}>📍</Text>
            </View>
            <Text style={styles.venueText} numberOfLines={1}>
              {event.event_venue || 'Venue TBD'}
            </Text>
          </View>

          {event.venue_url && event.venue_url.trim() !== '' ? (
            <TouchableOpacity
              style={styles.navigateBtn}
              activeOpacity={0.8}
              onPress={handleNavigateToVenue}
            >
              <Text style={styles.navigateIcon}>🗺️</Text>
              <Text style={styles.navigateText}>Navigate to Venue</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 6. Organized By */}
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>🏢</Text>
          <Text style={styles.organisedText} numberOfLines={1}>
            Organized by: <Text style={styles.organiserName}>{event.event_organised_by || 'N/A'}</Text>
          </Text>
        </View>

        {/* 7 & 8. SR Button and Indemnity Button */}
        <View style={styles.docButtonsRow}>
          {/* 7. SR Button */}
          <TouchableOpacity
            style={[styles.docBtn, !srPath && styles.disabledDocBtn]}
            activeOpacity={srPath ? 0.7 : 1}
            disabled={!srPath}
            onPress={() => openDocument(srPath, 'SR')}
          >
            <Text style={[styles.docBtnText, !srPath && styles.disabledDocText]}>
              {srPath ? '📄 SR Doc' : '📄 SR (N/A)'}
            </Text>
          </TouchableOpacity>

          {/* 8. Indemnity Button */}
          <TouchableOpacity
            style={[styles.docBtn, !indemnityPath && styles.disabledDocBtn]}
            activeOpacity={indemnityPath ? 0.7 : 1}
            disabled={!indemnityPath}
            onPress={() => openDocument(indemnityPath, 'Indemnity')}
          >
            <Text style={[styles.docBtnText, !indemnityPath && styles.disabledDocText]}>
              {indemnityPath ? '🛡️ Indemnity' : '🛡️ Indemnity (N/A)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 9, 10, 11. View Details, Results, Join Event */}
        <View style={styles.actionsGrid}>
          {/* 9. View Details Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.detailsBtn]}
            activeOpacity={0.8}
            onPress={() => onViewDetails && onViewDetails(event)}
          >
            <Text style={styles.actionBtnText}>Details</Text>
          </TouchableOpacity>

          {/* 10. Results Button */}
          {statusInfo.isResultAvailable ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.resultsBtn]}
              activeOpacity={0.8}
              onPress={() => onResults && onResults(event)}
            >
              <Text style={styles.actionBtnText}>Results</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtn, styles.disabledResultBtn]}>
              <Text style={styles.disabledResultText}>{statusInfo.resultActionText}</Text>
            </View>
          )}

          {/* 11. Join Event Button */}
          {isJoined ? (
            <View style={[styles.actionBtn, styles.joinedBtn]}>
              <Text style={styles.joinedBtnText}>✓ Joined</Text>
            </View>
          ) : statusInfo.status === 'live' ? (
            <View style={[styles.actionBtn, styles.disabledStatusBtn]}>
              <Text style={styles.disabledStatusText}>Closed</Text>
            </View>
          ) : statusInfo.status === 'completed' ? (
            <View style={[styles.actionBtn, styles.disabledStatusBtn]}>
              <Text style={styles.disabledStatusText}>Ended</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.joinBtn]}
              activeOpacity={0.8}
              onPress={() => onJoinEvent && onJoinEvent(event)}
            >
              <Text style={styles.joinBtnText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 12. Contact Us Row */}
        <TouchableOpacity
          style={styles.contactRow}
          activeOpacity={0.7}
          onPress={() => setContactModalVisible(true)}
        >
          <Text style={styles.contactIcon}>📞</Text>
          <Text style={styles.contactText}>Contact Organizer</Text>
          <Text style={styles.contactArrow}>➔</Text>
        </TouchableOpacity>
      </View>

      {/* CONTACT ORGANIZER MODAL */}
      <Modal
        visible={isContactModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setContactModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Contact Organizer</Text>
            <Text style={styles.modalSubtitle}>
              Organizer: {event.event_organised_by || 'Motorsport Organizer'}
            </Text>
            {organizerPhone ? (
              <Text style={styles.modalPhoneText}>Phone: {organizerPhone}</Text>
            ) : null}

            <TouchableOpacity style={styles.modalCallBtn} activeOpacity={0.8} onPress={handleCall}>
              <Text style={styles.modalBtnIcon}>📞</Text>
              <Text style={styles.modalCallBtnText}>Call Organizer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalWaBtn}
              activeOpacity={0.8}
              onPress={handleWhatsApp}
            >
              <Text style={styles.modalBtnIcon}>💬</Text>
              <Text style={styles.modalWaBtnText}>WhatsApp Organizer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              activeOpacity={0.7}
              onPress={() => setContactModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    backgroundColor: '#181818',
    position: 'relative',
  },
  imageLoaderContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181818',
    zIndex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
    lineHeight: 22,
  },
  dateChipsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1912',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dateChipIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  dateChipLabel: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '800',
  },
  dateChipValue: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  venueContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pinIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pinIcon: {
    fontSize: 13,
  },
  venueText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1912',
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 4,
  },
  navigateIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  navigateText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaIcon: {
    fontSize: 13,
    marginRight: 8,
  },
  organisedText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  organiserName: {
    color: COLORS.white,
    fontWeight: '700',
  },
  docButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  docBtn: {
    flex: 1,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledDocBtn: {
    backgroundColor: '#161616',
    borderColor: '#262626',
    opacity: 0.45,
  },
  docBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  disabledDocText: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  detailsBtn: {
    backgroundColor: '#202020',
    borderColor: COLORS.surfaceBorder,
  },
  resultsBtn: {
    backgroundColor: '#202020',
    borderColor: COLORS.surfaceBorder,
  },
  joinBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  joinBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 2,
  },
  contactIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  contactText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  contactArrow: {
    color: COLORS.accentOrange,
    fontSize: 13,
    fontWeight: '800',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  modalPhoneText: {
    fontSize: 13,
    color: COLORS.accentOrange,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  modalCallBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  modalWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  modalWaBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  modalBtnIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  disabledStatusBtn: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    opacity: 0.7,
  },
  disabledStatusText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledResultBtn: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    opacity: 0.7,
  },
  disabledResultText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  joinedBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  joinedBtnText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
  },
});
