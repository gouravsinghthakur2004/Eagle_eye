import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components';
import { useAppNavigation } from '@/context/NavigationContext';
import { useNotification } from '@/hooks/useNotification';
import { isEventResultAvailable } from '@/utils/eventLifecycle';
import { resultService } from '@/services/resultService';
import { ResultItem } from '@/types';

export const ResultsScreen: React.FC = () => {
  const { goBack, selectedEventData } = useAppNavigation();
  const { showWarning } = useNotification();
  const [results, setResults] = useState<ResultItem[]>([]);

  useEffect(() => {
    if (selectedEventData && !isEventResultAvailable(selectedEventData)) {
      showWarning('Results Unavailable', 'Results are not available for this event yet.');
      goBack();
      return;
    }
    resultService.getResults().then(setResults);
  }, [selectedEventData, goBack, showWarning]);

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack title="Leaderboard & Results" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Live Telemetry & Results</Text>
          <Text style={styles.subtitle}>Dubai Desert Championship 2026 • Official Timing</Text>
        </View>

        {results.map((res, i) => (
          <View key={i} style={styles.resultCard}>
            <View style={styles.topRow}>
              <Text style={styles.stageText}>{res.stage}</Text>
              <Text style={styles.posText}>{res.pos}</Text>
            </View>
            <Text style={styles.driverText}>{res.driver}</Text>
            <View style={styles.bottomRow}>
              <Text style={styles.timeText}>⏱️ {res.time}</Text>
              <Text style={styles.gapText}>{res.gap}</Text>
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
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stageText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  posText: { color: COLORS.primary, fontSize: 16, fontWeight: '900' },
  driverText: { color: COLORS.white, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  gapText: { color: COLORS.success, fontSize: 13, fontWeight: '700' },
});
