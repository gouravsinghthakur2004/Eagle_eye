import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components';
import { organizationService } from '@/services/organizationService';
import { OrganizationItem } from '@/types';

export const OrganizationsScreen: React.FC = () => {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);

  useEffect(() => {
    organizationService.getOrganizations().then(setOrganizations);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Racing Organizations</Text>
          <Text style={styles.subtitle}>Off-road clubs, rally organizers & sanctioning bodies.</Text>
        </View>

        {organizations.map((org) => (
          <TouchableOpacity key={org.id} style={styles.card} activeOpacity={0.8}>
            <Image
              source={{ uri: org.logo.startsWith('http') ? org.logo : 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=200&q=80' }}
              style={styles.logo}
            />
            <View style={styles.info}>
              <Text style={styles.orgName}>{org.name}</Text>
              <Text style={styles.orgType}>{org.type} • {org.location}</Text>
              <Text style={styles.eventsCount}>{org.eventsCount} Hosted Championships</Text>
            </View>
          </TouchableOpacity>
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
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  logo: { width: 60, height: 60, borderRadius: 14, marginRight: 16 },
  info: { flex: 1 },
  orgName: { color: COLORS.white, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  orgType: { color: COLORS.accentOrange, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  eventsCount: { color: COLORS.textMuted, fontSize: 12 },
});
