import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components/layout/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAppNavigation } from '@/context/NavigationContext';

export const TermsConditionsScreen: React.FC = () => {
  const { goBack, setTermsAcceptedInJoin } = useAppNavigation();

  const handleAccept = () => {
    setTermsAcceptedInJoin(true);
    goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Terms & Conditions" showBack onBack={goBack} />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.heading}>Motorsports Official Rules & Regulations</Text>
          <Text style={styles.lastUpdated}>Last Updated: August 2026</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Risk Acknowledgment & Safety Compliance</Text>
            <Text style={styles.paragraph}>
              Motorsport activities, racing events, and offroad trials are inherently hazardous and involve significant risk of personal injury, property damage, or loss. By registering for this event, all drivers, navigators, and team members acknowledge these risks and agree to strictly comply with all safety instructions, flag signals, speed limits, and marshal directions issued by EagleEye Motorsport Officials.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Technical Scrutineering & Vehicle Compliance</Text>
            <Text style={styles.paragraph}>
              All registered vehicles must pass mandatory technical scrutineering prior to flag-off. Vehicles must have valid Registration Certificate (RC), comprehensive insurance, roll cage (where applicable), working seatbelts, harness, fire extinguisher, and FIA/FMSC compliant safety gear (helmets, suits, gloves). Non-compliant vehicles will be disqualified without refund.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Telemetry & GPS Tracking Consent</Text>
            <Text style={styles.paragraph}>
              Participants explicitly consent to real-time telemetry monitoring, speed limit enforcement, stage timing, and GPS tracking conducted by EagleEye officials throughout the event. Tampering with telemetry units or GPS logging equipment will result in immediate disqualification and blacklisting.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Code of Conduct & Sportsmanship</Text>
            <Text style={styles.paragraph}>
              Unsportsmanlike conduct, reckless driving outside designated stage limits, abuse of officials, or consumption of alcohol/substances during competition hours will lead to instant ejection from the championship and revocation of points.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Indemnity & Liability Release</Text>
            <Text style={styles.paragraph}>
              By proceeding with event join submission, participants waive all claims against the event organizers, sponsors, venue owners, and EagleEye platform for any injury, vehicle damage, or incidental losses incurred during the event.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Accept Button */}
      <View style={styles.bottomBar}>
        <PrimaryButton title="I Agree & Accept Terms 🏁" onPress={handleAccept} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 20,
  },
  heading: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  lastUpdated: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  paragraph: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
});
