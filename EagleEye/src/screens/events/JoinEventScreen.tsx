import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components/layout/Header';
import { InputField } from '@/components/forms/InputField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { KeyboardAwareFormContainer, KeyboardAwareFormContainerRef } from '@/components/common/KeyboardAwareFormContainer';
import { useAppNavigation } from '@/context/NavigationContext';
import { eventService } from '@/services/eventService';
import { bookingService } from '@/services/bookingService';
import { EventCategory, EventClass, JoinEventPayload } from '@/types';
import { useNotification } from '@/hooks/useNotification';

import { FormErrorBanner } from '@/components/common/FormErrorBanner';

const isDateInFuture = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const selected = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return selected > today;
};

export const JoinEventScreen: React.FC = () => {
  const {
    goBack,
    navigate,
    finishJoinEventAndNavigateToMyEvents,
    selectedJoinEvent,
    selectedDriverForJoin,
    selectedNavigatorForJoin,
    selectedVehicleForJoin,
    termsAcceptedInJoin,
    setTermsAcceptedInJoin,
    joinFormDraft,
    updateJoinFormDraft,
  } = useAppNavigation();

  const { showSuccess, showError } = useNotification();
  const formContainerRef = useRef<KeyboardAwareFormContainerRef>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    Keyboard.dismiss();
    const timer = setTimeout(() => {
      formContainerRef.current?.scrollTo({ y: 0, animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [selectedJoinEvent]);

  // Auto-initialize form default values if draft is fresh - Start 100% clean
  useEffect(() => {
    // Keep form 100% clean on new Join Event
  }, []);

  const event = selectedJoinEvent || {
    id: '1',
    event_name: 'Motorsport Championship 2026',
    event_venue: 'Official Event Venue',
    event_start_date: '2026-09-10',
  };

  const eventId = String(event.id || '1');

  // Form Fields derived from persistent context draft
  const asn = joinFormDraft.asn;
  const setAsn = (val: string) => {
    updateJoinFormDraft({ asn: val });
    if (formErrors.length > 0) setFormErrors([]);
  };

  const team = joinFormDraft.team;
  const setTeam = (val: string) => {
    updateJoinFormDraft({ team: val });
    if (formErrors.length > 0) setFormErrors([]);
  };

  // Category & Class API States
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [classes, setClasses] = useState<EventClass[]>([]);

  const selectedCategory = joinFormDraft.category;
  const setSelectedCategory = (cat: EventCategory | null) => {
    updateJoinFormDraft({ category: cat, classItem: null });
    if (formErrors.length > 0) setFormErrors([]);
  };

  const selectedClass = joinFormDraft.classItem;
  const setSelectedClass = (cls: EventClass | null) => {
    updateJoinFormDraft({ classItem: cls });
    if (formErrors.length > 0) setFormErrors([]);
  };

  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(false);

  // Modal Dropdown Controls
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [showClassDropdown, setShowClassDropdown] = useState<boolean>(false);
  const [showPaymentModeDropdown, setShowPaymentModeDropdown] = useState<boolean>(false);

  // Payment Section State derived from persistent context draft
  const paymentMode = joinFormDraft.paymentMode;
  const setPaymentMode = (mode: string) => {
    updateJoinFormDraft({ paymentMode: mode });
    if (formErrors.length > 0) setFormErrors([]);
  };

  const paymentReference = joinFormDraft.paymentReference;
  const setPaymentReference = (ref: string) => {
    updateJoinFormDraft({ paymentReference: ref });
    if (formErrors.length > 0) setFormErrors([]);
  };

  const paymentDate = joinFormDraft.paymentDate;
  const setPaymentDate = (dt: string) => {
    updateJoinFormDraft({ paymentDate: dt });
    if (formErrors.length > 0) setFormErrors([]);
  };

  const paymentAmount = joinFormDraft.paymentAmount;
  const setPaymentAmount = (amt: string) => {
    updateJoinFormDraft({ paymentAmount: amt });
    if (formErrors.length > 0) setFormErrors([]);
  };

  // Submit State
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. Fetch Categories on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      setLoadingCategories(true);
      const data = await eventService.getEventCategories(eventId);
      if (isMounted) {
        setCategories(data);
        setLoadingCategories(false);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Fetch Classes when category changes
  useEffect(() => {
    if (!eventId || !selectedCategory?.id) {
      setClasses([]);
      return;
    }
    const fetchClassesData = async () => {
      try {
        setLoadingClasses(true);
        const clsList = await eventService.getEventClasses(selectedCategory.id, eventId);
        setClasses(clsList);
      } catch (err) {
        console.warn('[JoinEventScreen] Error fetching classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClassesData();
  }, [eventId, selectedCategory?.id]);

  const handleSubmit = async () => {
    const errors: string[] = [];

    if (!asn.trim()) {
      errors.push('ASN / FMN Competition License number is required.');
    }
    if (!team.trim()) {
      errors.push('Team Name is required.');
    }
    if (!selectedDriverForJoin?.id) {
      errors.push('Please select a registered Driver.');
    } else if (selectedDriverForJoin.role_type && String(selectedDriverForJoin.role_type).toLowerCase() !== 'driver') {
      errors.push('Selected Driver must be a valid Driver profile.');
    }
    if (!selectedNavigatorForJoin?.id) {
      errors.push('Please select a registered Navigator.');
    } else if (selectedNavigatorForJoin.role_type && String(selectedNavigatorForJoin.role_type).toLowerCase() !== 'navigator') {
      errors.push('Selected Navigator must be a valid Navigator profile.');
    }
    if (!selectedVehicleForJoin?.id) {
      errors.push('Please select a registered Race Vehicle.');
    }
    if (!selectedCategory?.id) {
      errors.push('Please select an Event Category.');
    }
    if (!selectedClass?.id) {
      errors.push('Please select an Event Class.');
    }
    if (!paymentMode) {
      errors.push('Payment Mode selection is required.');
    }
    if (!paymentReference.trim()) {
      errors.push('Payment Reference / Transaction ID is required.');
    }
    if (!paymentDate.trim()) {
      errors.push('Payment Date selection is required.');
    }
    if (!paymentAmount.trim() || parseFloat(paymentAmount) <= 0) {
      errors.push('A valid Payment Amount is required.');
    }
    if (!termsAcceptedInJoin) {
      errors.push('You must accept the Event Terms & Conditions to proceed.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      formContainerRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setFormErrors([]);

    const payload: JoinEventPayload = {
      event_id: Number(eventId),
      asn: asn.trim(),
      team: team.trim(),
      driver_id: selectedDriverForJoin?.id || 0,
      navigator_id: selectedNavigatorForJoin?.id || 0,
      vehicle_id: selectedVehicleForJoin?.id || 0,
      category_id: selectedCategory?.id || 0,
      class_id: selectedClass?.id || 0,
      payment_mode: paymentMode,
      payment_reference: paymentReference.trim(),
      payment_date: paymentDate.trim(),
      payment_amount: parseFloat(paymentAmount),
      terms_accepted: 1,
    };

    try {
      setSubmitting(true);
      const res = await bookingService.joinEvent(payload);
      setSubmitting(false);

      if (res.success) {
        showSuccess(
          'Registration Successful! 🏁',
          res.message || `You have successfully registered for "${event?.event_name}".`
        );
        finishJoinEventAndNavigateToMyEvents();
      } else {
        showError('Registration Failed', res.message || 'Could not complete event registration.');
      }
    } catch (err: any) {
      setSubmitting(false);
      showError('Error', err.message || 'Failed to submit event registration.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Join Event" showBack onBack={goBack} />

      <View style={styles.flexOne}>
        <KeyboardAwareFormContainer
          ref={formContainerRef}
          contentContainerStyle={styles.scrollContent}
          extraScrollHeight={140}
        >
          {/* Event Header Banner */}
          <View style={styles.eventCardHeader}>
            <Text style={styles.eventBadge}>EVENT REGISTRATION</Text>
            <Text style={styles.eventName}>{event?.event_name || 'Loading Event...'}</Text>
            <Text style={styles.eventSub}>{event?.event_venue || 'Motorsport Circuit'}</Text>
          </View>

          {/* Global Form Validation Error Notification Banner */}
          <FormErrorBanner
            errors={formErrors}
            onDismiss={() => setFormErrors([])}
          />

          {/* Section 1: Team & License Details */}
          <View style={styles.formSectionCard}>
            <Text style={styles.sectionHeading}>1. TEAM & LICENSE DETAILS</Text>
            <InputField
              label="ASN / FMN Competition License"
              placeholder="e.g. FMSC-2026-9901"
              value={asn}
              onChangeText={setAsn}
              icon="🏁"
            />
            <InputField
              label="Team Name"
              placeholder="e.g. Redline Motorsports"
              value={team}
              onChangeText={setTeam}
              icon="👥"
            />
          </View>

          {/* Section 2: Driver & Navigator Selection */}
          <View style={styles.formSectionCard}>
            <Text style={styles.sectionHeading}>2. RACER CREW SELECTION</Text>

            {/* Driver Field */}
            <Text style={styles.fieldLabel}>Select Driver *</Text>
            <TouchableOpacity
              style={styles.selectorCardBox}
              activeOpacity={0.8}
              onPress={() => navigate('SelectDriver')}
            >
              <Text style={styles.selectorIcon}>🏎️</Text>
              <View style={styles.selectorTextContainer}>
                {selectedDriverForJoin ? (
                  <>
                    <Text style={styles.selectorValueText}>{selectedDriverForJoin.full_name}</Text>
                    {Boolean(selectedDriverForJoin.mobile_no) && (
                      <Text style={styles.selectorSubText}>Mobile: {selectedDriverForJoin.mobile_no}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholderText}>Tap to search and select Driver</Text>
                )}
              </View>
              <Text style={styles.selectorArrowText}>➔</Text>
            </TouchableOpacity>

            {/* Navigator Field */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Select Navigator *</Text>
            <TouchableOpacity
              style={styles.selectorCardBox}
              activeOpacity={0.8}
              onPress={() => navigate('SelectNavigator')}
            >
              <Text style={styles.selectorIcon}>🗺️</Text>
              <View style={styles.selectorTextContainer}>
                {selectedNavigatorForJoin ? (
                  <>
                    <Text style={styles.selectorValueText}>{selectedNavigatorForJoin.full_name}</Text>
                    {Boolean(selectedNavigatorForJoin.mobile_no) && (
                      <Text style={styles.selectorSubText}>Mobile: {selectedNavigatorForJoin.mobile_no}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholderText}>Tap to search and select Navigator</Text>
                )}
              </View>
              <Text style={styles.selectorArrowText}>➔</Text>
            </TouchableOpacity>
          </View>

          {/* Section 3: Vehicle Selection */}
          <View style={styles.formSectionCard}>
            <Text style={styles.sectionHeading}>3. VEHICLE SPECIFICATION</Text>
            <Text style={styles.fieldLabel}>Select Race Vehicle *</Text>
            <TouchableOpacity
              style={styles.selectorCardBox}
              activeOpacity={0.8}
              onPress={() => navigate('SelectVehicle')}
            >
              <Text style={styles.selectorIcon}>🚜</Text>
              <View style={styles.selectorTextContainer}>
                {selectedVehicleForJoin ? (
                  <>
                    <Text style={styles.selectorValueText}>
                      {selectedVehicleForJoin.vehicle_rc_no || selectedVehicleForJoin.vehicle_nick_name || 'Selected Vehicle'}
                    </Text>
                    {Boolean(selectedVehicleForJoin.vehicle_manufacturing || selectedVehicleForJoin.vehicle_model) && (
                      <Text style={styles.selectorSubText}>
                        {selectedVehicleForJoin.vehicle_manufacturing || ''} {selectedVehicleForJoin.vehicle_model || ''}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholderText}>Tap to search and select Vehicle</Text>
                )}
              </View>
              <Text style={styles.selectorArrowText}>➔</Text>
            </TouchableOpacity>
          </View>

          {/* Section 4: Category & Class Dropdowns */}
          <View style={styles.formSectionCard}>
            <Text style={styles.sectionHeading}>4. CATEGORY & CLASS SELECTION</Text>

            {/* Category Dropdown */}
            <Text style={styles.fieldLabel}>Event Category *</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              activeOpacity={0.8}
              onPress={() => setShowCategoryDropdown((prev) => !prev)}
            >
              <Text style={styles.dropdownIcon}>🏆</Text>
              <Text style={selectedCategory ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {selectedCategory ? selectedCategory.category_name : 'Select Event Category'}
              </Text>
              <Text style={styles.dropdownArrow}>{showCategoryDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Category Options List */}
            {showCategoryDropdown && (
              <View style={styles.dropdownOptionsContainer}>
                {loadingCategories ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 12 }} />
                ) : (
                  categories.map((cat) => (
                    <TouchableOpacity
                      key={String(cat.id)}
                      style={styles.dropdownOptionItem}
                      onPress={() => {
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={styles.optionTitle}>{cat.category_name}</Text>
                      {Boolean(cat.category_desc) && (
                        <Text style={styles.optionSub}>{cat.category_desc}</Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Class Dropdown (Disabled until category selected) */}
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Event Class *</Text>
            <TouchableOpacity
              style={[
                styles.dropdownBox,
                !selectedCategory && styles.disabledDropdownBox,
              ]}
              activeOpacity={selectedCategory ? 0.8 : 1}
              disabled={!selectedCategory}
              onPress={() => setShowClassDropdown((prev) => !prev)}
            >
              <Text style={styles.dropdownIcon}>🏁</Text>
              <Text
                style={
                  selectedClass
                    ? styles.dropdownValue
                    : !selectedCategory
                    ? styles.disabledDropdownText
                    : styles.dropdownPlaceholder
                }
              >
                {!selectedCategory
                  ? 'Select Category First'
                  : selectedClass
                  ? selectedClass.class_name
                  : 'Select Event Class'}
              </Text>
              <Text style={styles.dropdownArrow}>{showClassDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Class Options List */}
            {showClassDropdown && selectedCategory && (
              <View style={styles.dropdownOptionsContainer}>
                {loadingClasses ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 12 }} />
                ) : classes.length === 0 ? (
                  <Text style={styles.emptyOptionText}>No classes available for this category.</Text>
                ) : (
                  classes.map((cls) => (
                    <TouchableOpacity
                      key={String(cls.id)}
                      style={styles.dropdownOptionItem}
                      onPress={() => {
                        setSelectedClass(cls);
                        setShowClassDropdown(false);
                      }}
                    >
                      <Text style={styles.optionTitle}>{cls.class_name}</Text>
                      {Boolean(cls.class_desc) && (
                        <Text style={styles.optionSub}>{cls.class_desc}</Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Section 5: Payment Details */}
          <View style={styles.formSectionCard}>
            <Text style={styles.sectionHeading}>5. PAYMENT DETAILS</Text>

            {/* Payment Mode Selector */}
            <Text style={styles.fieldLabel}>Payment Mode *</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              activeOpacity={0.8}
              onPress={() => setShowPaymentModeDropdown((prev) => !prev)}
            >
              <Text style={styles.dropdownIcon}>💳</Text>
              <Text style={styles.dropdownValue}>{paymentMode}</Text>
              <Text style={styles.dropdownArrow}>{showPaymentModeDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showPaymentModeDropdown && (
              <View style={styles.dropdownOptionsContainer}>
                {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={styles.dropdownOptionItem}
                    onPress={() => {
                      setPaymentMode(mode);
                      setShowPaymentModeDropdown(false);
                    }}
                  >
                    <Text style={styles.optionTitle}>{mode}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Payment Reference */}
            <InputField
              label={paymentMode === 'Cash' ? 'Payment Reference (Optional for Cash)' : 'Payment Reference *'}
              placeholder="e.g. UPI202688990011 / TXN-998812"
              value={paymentReference}
              onChangeText={setPaymentReference}
              icon="🔖"
              required={paymentMode !== 'Cash'}
            />

            {/* Payment Date */}
            <DatePickerInput
              label="Payment Date *"
              value={paymentDate}
              onChangeDate={setPaymentDate}
              icon="📅"
              placeholder="Select Payment Date"
              maxYear={2026}
            />
            {isDateInFuture(paymentDate) && (
              <Text style={styles.errorHint}>⚠️ Payment date cannot be in the future.</Text>
            )}

            {/* Payment Amount */}
            <InputField
              label="Payment Amount (INR) *"
              placeholder="e.g. 5000"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              icon="₹"
              required
            />
          </View>

          {/* Section 6: Terms & Conditions Checkbox */}
          <View style={styles.formSectionCard}>
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.8}
              onPress={() => setTermsAcceptedInJoin(!termsAcceptedInJoin)}
            >
              <View style={[styles.checkbox, termsAcceptedInJoin && styles.checkboxChecked]}>
                {termsAcceptedInJoin ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => navigate('TermsConditions')}>
                  Terms & Conditions
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Submit Action (Natural Scrollable Form End) */}
          <View style={styles.footerBar}>
            <PrimaryButton
              title={submitting ? 'Submitting Registration...' : 'Join Event 🏁'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
            />
          </View>
        </KeyboardAwareFormContainer>
      </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  eventCardHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  eventBadge: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  eventName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  eventSub: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '600',
  },
  formSectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  sectionHeading: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  selectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  selectorIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  selectorValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  selectorArrow: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '800',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  disabledDropdownBox: {
    opacity: 0.5,
  },
  selectorCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 4,
  },
  selectorValueText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  selectorSubText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  selectorPlaceholderText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  selectorArrowText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  dropdownIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  dropdownPlaceholder: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  dropdownValue: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  disabledDropdownText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  dropdownArrow: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  dropdownOptionsContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  dropdownOptionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  optionTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  optionSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyOptionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    padding: 12,
    textAlign: 'center',
  },
  errorHint: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: COLORS.background,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
  checkboxLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  termsLink: {
    color: COLORS.accentOrange,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  footerBar: {
    marginTop: 16,
    marginBottom: 32,
    paddingTop: 8,
  },
  disabledBtn: {
    opacity: 0.55,
  },
});
