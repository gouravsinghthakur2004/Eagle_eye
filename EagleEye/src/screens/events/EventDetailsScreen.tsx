import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { useAppNavigation } from '@/context/NavigationContext';
import { eventService } from '@/services/eventService';
import { bookingService } from '@/services/bookingService';
import { EventItem } from '@/types';
import { getEventStatusInfo } from '@/utils/eventLifecycle';

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80';

// Date formatting helper: "YYYY-MM-DD HH:MM:SS" -> "04 Aug 2026"
const formatDateOnly = (dateStr?: string | null): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  const cleanStr = dateStr.trim().split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2].padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }
  return cleanStr;
};

// Time formatting helper: "11:00:00" -> "11:00 AM", "14:00:00" -> "02:00 PM"
const formatTimeOnly = (dateStr?: string | null): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  const parts = dateStr.trim().split(' ');
  if (parts.length < 2) return '';
  const timePart = parts[1]; // "11:00:00"
  const timeSplit = timePart.split(':');
  if (timeSplit.length >= 2) {
    let hour = parseInt(timeSplit[0], 10);
    const minute = timeSplit[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
  }
  return timePart;
};

export const EventDetailsScreen: React.FC = () => {
  const { goBack, navigate, selectedEventId, selectedEventData, openJoinEvent, currentScreen } = useAppNavigation();

  const [event, setEvent] = useState<EventItem | null>(selectedEventData || null);
  const [loading, setLoading] = useState<boolean>(!selectedEventData);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isContactModalVisible, setContactModalVisible] = useState<boolean>(false);
  const [isJoined, setIsJoined] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkJoinedStatus = async (eId: string) => {
      try {
        const joined = await bookingService.isEventAlreadyJoined(eId);
        if (isMounted) setIsJoined(joined);
      } catch {}
    };

    if (event?.id) {
      checkJoinedStatus(String(event.id));
    }

    return () => {
      isMounted = false;
    };
  }, [event?.id, currentScreen]);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (selectedEventId) {
        setLoading(true);
        const data = await eventService.getEventDetails(selectedEventId);
        if (isMounted && data) {
          setEvent(data);
        }
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedEventId]);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (selectedEventId) {
        setLoading(true);
        const data = await eventService.getEventDetails(selectedEventId);
        if (isMounted && data) {
          setEvent(data);
        }
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedEventId]);

  // Image URI resolution
  const getInitialImageUri = () => {
    if (!event || !event.event_pic || event.event_pic.trim() === '') return DEFAULT_HERO_IMAGE;
    if (event.event_pic.startsWith('http://') || event.event_pic.startsWith('https://')) {
      return event.event_pic;
    }
    const cleanPath = event.event_pic.replace(/^\//, '');
    return `https://eagleeyeofficial.com/demo/${cleanPath}`;
  };

  const [imageUri, setImageUri] = useState<string>(getInitialImageUri());

  useEffect(() => {
    if (event) {
      setImageUri(getInitialImageUri());
      setImageError(false);
    }
  }, [event]);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageUri(DEFAULT_HERO_IMAGE);
    }
  };

  // Map Navigation
  const handleNavigateToVenue = () => {
    if (event?.venue_url) {
      Linking.openURL(event.venue_url).catch(() => {
        Alert.alert('Error', 'Could not open venue map location.');
      });
    }
  };

  // Document Helpers
  const srPath = event?.sr_path || null;
  const indemnityPath = event?.indeminity_path || event?.indemnity_path || null;

  const openDocument = (path: string | null, docName: string) => {
    if (!path) return;
    const fullUrl = path.startsWith('http') ? path : `https://eagleeyeofficial.com/demo/${path}`;
    Linking.openURL(fullUrl).catch(() => {
      Alert.alert('Error', `Could not open ${docName} document.`);
    });
  };

  // Contact Organizer Helpers
  const organizerPhone = event?.event_organizer_no || '';
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
      Alert.alert('Error', 'Could not open WhatsApp.');
    });
  };

  const handleJoinNow = () => {
    if (!event) return;
    if (isJoined) {
      navigate('MyEvents');
      return;
    }
    openJoinEvent(event);
  };

  const handleGoToResults = () => {
    navigate('Results');
  };

  // Check if About Event description is valid (Hide if empty or 'test')
  const isValidDescription = Boolean(
    event?.event_desc &&
    event.event_desc.trim() !== '' &&
    event.event_desc.trim().toLowerCase() !== 'test'
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {loading && !event ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      ) : event ? (
        <View style={styles.flexOne}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. HERO BANNER SECTION */}
            <View style={styles.heroSection}>
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
              {/* Back Button Overlay */}
              <TouchableOpacity
                style={styles.backBtnOverlay}
                activeOpacity={0.8}
                onPress={goBack}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bodyContent}>
              {/* EVENT NAME */}
              <Text style={styles.eventTitle}>{event.event_name}</Text>

              {/* 2. DATE CARD (Start • End in Single Row) */}
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

              {/* 3. VENUE SECTION */}
              <View style={styles.cardSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.pinIconBg}>
                    <Text style={styles.pinIcon}>📍</Text>
                  </View>
                  <View style={styles.sectionTextContainer}>
                    <Text style={styles.sectionLabel}>Venue Location</Text>
                    <Text style={styles.sectionValueText}>{event.event_venue || 'Venue TBD'}</Text>
                  </View>
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

              {/* 4. ORGANIZER SECTION */}
              <View style={styles.cardSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.orgIconBg}>
                    <Text style={styles.orgIcon}>🏢</Text>
                  </View>
                  <View style={styles.sectionTextContainer}>
                    <Text style={styles.sectionLabel}>Organized By</Text>
                    <Text style={styles.sectionValueText}>{event.event_organised_by}</Text>
                  </View>
                </View>
              </View>

              {/* 5. ABOUT EVENT SECTION (Conditional: Hidden if empty or 'test') */}
              {isValidDescription && (
                <View style={styles.cardSection}>
                  <Text style={styles.sectionHeading}>About Event</Text>
                  <Text style={styles.aboutText}>{event.event_desc}</Text>
                </View>
              )}

              {/* 6. EVENT TIMING SECTION */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeading}>Event Timing</Text>
                <View style={styles.timingGrid}>
                  <View style={styles.timingRow}>
                    <Text style={styles.timingLabel}>Event Start Date:</Text>
                    <Text style={styles.timingValue}>{formatDateOnly(event.event_start_date)}</Text>
                  </View>
                  <View style={styles.timingRow}>
                    <Text style={styles.timingLabel}>Event Start Time:</Text>
                    <Text style={styles.timingValue}>{formatTimeOnly(event.event_start_date) || '11:00 AM'}</Text>
                  </View>
                  <View style={styles.timingRow}>
                    <Text style={styles.timingLabel}>Event End Date:</Text>
                    <Text style={styles.timingValue}>{formatDateOnly(event.event_end_date)}</Text>
                  </View>
                  <View style={styles.timingRow}>
                    <Text style={styles.timingLabel}>Event End Time:</Text>
                    <Text style={styles.timingValue}>{formatTimeOnly(event.event_end_date) || '02:00 PM'}</Text>
                  </View>
                </View>
              </View>

              {/* 7. DOCUMENTS SECTION */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeading}>Event Documents</Text>
                <View style={styles.docButtonsRow}>
                  {/* SR Button */}
                  <TouchableOpacity
                    style={[styles.docBtn, !srPath && styles.disabledDocBtn]}
                    activeOpacity={srPath ? 0.7 : 1}
                    disabled={!srPath}
                    onPress={() => openDocument(srPath, 'SR')}
                  >
                    <Text style={[styles.docBtnText, !srPath && styles.disabledDocText]}>
                      {srPath ? '📄 SR Document' : '📄 SR Document (N/A)'}
                    </Text>
                  </TouchableOpacity>

                  {/* Indemnity Button */}
                  <TouchableOpacity
                    style={[styles.docBtn, !indemnityPath && styles.disabledDocBtn]}
                    activeOpacity={indemnityPath ? 0.7 : 1}
                    disabled={!indemnityPath}
                    onPress={() => openDocument(indemnityPath, 'Indemnity')}
                  >
                    <Text style={[styles.docBtnText, !indemnityPath && styles.disabledDocText]}>
                      {indemnityPath ? '🛡️ Indemnity Doc' : '🛡️ Indemnity (N/A)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 8. CONTACT ORGANIZER SECTION */}
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
          </ScrollView>

          {/* 9. STICKY BOTTOM ACTION BAR */}
          {(() => {
            const statusInfo = getEventStatusInfo(event?.event_start_date, event?.event_end_date, event?.result_published);
            return (
              <View style={styles.stickyFooter}>
                <TouchableOpacity
                  style={[styles.joinNowBtn, isJoined && styles.joinedBtn]}
                  activeOpacity={0.8}
                  onPress={handleJoinNow}
                >
                  <Text style={styles.joinNowText}>
                    {isJoined ? 'Already Registered 🏎️' : 'Join Event 🏁'}
                  </Text>
                </TouchableOpacity>

                {statusInfo.isResultAvailable ? (
                  <TouchableOpacity
                    style={styles.resultsBtn}
                    activeOpacity={0.8}
                    onPress={handleGoToResults}
                  >
                    <Text style={styles.resultsText}>Results</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.resultsBtn, styles.disabledResultsBtnFooter]}>
                    <Text style={styles.disabledResultsTextFooter}>{statusInfo.resultActionText}</Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Event details could not be loaded.</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={goBack}>
            <Text style={styles.backHomeText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

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
              Organizer: {event?.event_organised_by || 'Motorsport Organizer'}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flexOne: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  backHomeBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  backHomeText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroSection: {
    width: '100%',
    height: 220,
    backgroundColor: '#181818',
    position: 'relative',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageLoaderContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181818',
    zIndex: 1,
  },
  backBtnOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backIcon: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 12,
  },
  dateChipsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1912',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dateChipIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  dateChipLabel: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '800',
  },
  dateChipValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cardSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pinIcon: {
    fontSize: 18,
  },
  orgIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgIcon: {
    fontSize: 18,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionValueText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1912',
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  navigateIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  navigateText: {
    color: COLORS.accentOrange,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeading: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  aboutText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  timingGrid: {
    gap: 8,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  timingLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  timingValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  docButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  docBtn: {
    flex: 1,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 12,
    paddingVertical: 10,
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
    fontSize: 12,
    fontWeight: '700',
  },
  disabledDocText: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  contactText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  contactArrow: {
    color: COLORS.accentOrange,
    fontSize: 16,
    fontWeight: '800',
  },

  // Sticky Footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  joinNowBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedBtn: {
    backgroundColor: '#10B981',
  },
  joinNowText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
  disabledJoinBtn: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    opacity: 0.7,
  },
  disabledJoinText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  resultsBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  disabledResultsBtnFooter: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    opacity: 0.7,
  },
  disabledResultsTextFooter: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
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
});
