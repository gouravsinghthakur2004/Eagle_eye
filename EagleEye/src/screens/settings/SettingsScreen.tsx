import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components';

export const SettingsScreen: React.FC = () => {
  const [telemetry, setTelemetry] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Settings & Preferences</Text>
          <Text style={styles.subtitle}>Configure app preferences, security & telemetry sync.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Race Telemetry & Sync</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Real-Time GPS Telemetry</Text>
              <Text style={styles.settingSub}>Broadcast live position to race control</Text>
            </View>
            <Switch
              value={telemetry}
              onValueChange={setTelemetry}
              trackColor={{ false: '#333', true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingSub}>Stage start alerts & result updates</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: '#333', true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Audio Engine Sounds</Text>
              <Text style={styles.settingSub}>Play engine sound effects on navigation</Text>
            </View>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: '#333', true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  titleSection: { marginBottom: 20 },
  title: { color: COLORS.white, fontSize: 26, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  groupTitle: { color: COLORS.primary, fontSize: 14, fontWeight: '800', marginBottom: 16, textTransform: 'uppercase' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  settingText: { flex: 1, paddingRight: 16 },
  settingLabel: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  settingSub: { color: COLORS.textMuted, fontSize: 12 },
});
