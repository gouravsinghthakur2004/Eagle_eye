import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components';

const NOTIFS = [
  { id: 'n1', title: 'Registration Confirmed!', body: 'You are registered for Dubai Desert Championship Stage 1.', time: '10m ago', icon: '✅' },
  { id: 'n2', title: 'Live Telemetry Active', body: 'GPS tracking signal established for vehicle #77.', time: '1h ago', icon: '📡' },
  { id: 'n3', title: 'New Event Announcement', body: 'Morocco Desert Trophy registration is now open.', time: '3h ago', icon: '🏁' },
];

export const NotificationsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header showBack title="Notifications" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Real-time telemetry, stage starts & announcements.</Text>
        </View>

        {NOTIFS.map((n) => (
          <View key={n.id} style={styles.card}>
            <Text style={styles.icon}>{n.icon}</Text>
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.timeText}>{n.time}</Text>
              </View>
              <Text style={styles.bodyText}>{n.body}</Text>
            </View>
          </View>
        ))}
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
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  icon: { fontSize: 24, marginRight: 14 },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  timeText: { color: COLORS.textMuted, fontSize: 12 },
  bodyText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
});
