import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { useStore } from '../store';
import { computeDigest } from '../utils/digest';
import { DigestCard } from '../components/DigestCard';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { DigestItem } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { contacts, settings } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [digestItems, setDigestItems] = useState<DigestItem[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setDigestItems(computeDigest(contacts));
  }, [contacts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDigestItems(computeDigest(contacts));
    setRefreshing(false);
  }, [contacts]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = settings.userName?.split(' ')[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting()}{firstName ? `, ${firstName}` : ''}!
            </Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>
        </View>

        {/* Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's connections</Text>
          {digestItems.length > 0 && (
            <Text style={styles.sectionSub}>
              {digestItems.length} {digestItems.length === 1 ? 'person' : 'people'} to reach out to
            </Text>
          )}
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.emptyTitle}>Welcome to ContactMachine!</Text>
            <Text style={styles.emptyBody}>
              Add your first contact or import from your phone to get started.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => navigation.navigate('AddEditContact', {})}
            >
              <Text style={styles.ctaBtnText}>Add a contact</Text>
            </TouchableOpacity>
          </View>
        ) : digestItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyBody}>No one to reach out to today. Check back tomorrow.</Text>
          </View>
        ) : (
          digestItems.map((item) => (
            <DigestCard
              key={item.contact.id}
              item={item}
              onPress={() =>
                navigation.navigate('ContactDetail', { contactId: item.contact.id })
              }
              onMessageSuggestions={() =>
                navigation.navigate('MessageSuggestions', { contactId: item.contact.id })
              }
              apiKey={settings.anthropicApiKey}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 4,
  },
  greeting: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  date: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  sectionSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  ctaBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
