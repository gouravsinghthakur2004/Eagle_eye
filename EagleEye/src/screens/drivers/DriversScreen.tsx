import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components';
import { useAppNavigation } from '@/context/NavigationContext';
import { driverNavigatorService } from '@/services/driverNavigatorService';

export const DriversScreen: React.FC = () => {
  const { navigate } = useAppNavigation();
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    driverNavigatorService.getProfiles(undefined, 'driver').then(setDrivers);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Driver Directory</Text>
          <Text style={styles.subtitle}>Championship leaderboards & registered drivers.</Text>
        </View>

        {drivers.map((driver, index) => (
          <TouchableOpacity
            key={driver.id}
            activeOpacity={0.85}
            style={styles.driverCard}
            onPress={() => navigate('DriverNavigatorProfile')}
          >

            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{driver.rank || index + 1}</Text>
            </View>

            <Image source={{ uri: driver.avatar }} style={styles.avatar} />

            <View style={styles.driverInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverNumber}>{driver.number}</Text>
              </View>
              <Text style={styles.teamText}>{driver.team}</Text>
              <Text style={styles.categoryText}>{driver.category}</Text>
            </View>

            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{driver.points} pts</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  rankText: {
    color: COLORS.accentOrange,
    fontSize: 13,
    fontWeight: '900',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  driverInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 6,
  },
  driverNumber: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  teamText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  categoryText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  pointsText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
