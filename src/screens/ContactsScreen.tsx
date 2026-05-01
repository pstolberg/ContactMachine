import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { ContactCard } from '../components/ContactCard';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RelationshipType } from '../types';
import { requestContactsPermission, importDeviceContacts } from '../services/contactsImport';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const FILTERS: Array<{ label: string; value: RelationshipType | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Friends', value: 'friend' },
  { label: 'Family', value: 'family' },
  { label: 'Colleagues', value: 'colleague' },
  { label: 'Acquaintances', value: 'acquaintance' },
];

export function ContactsScreen() {
  const navigation = useNavigation<NavProp>();
  const { contacts, addContact, settings } = useStore();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RelationshipType | 'all'>('all');
  const [importing, setImporting] = useState(false);

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter !== 'all') list = list.filter((c) => c.relationship === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, filter, query]);

  async function handleImport() {
    setImporting(true);
    try {
      const granted = await requestContactsPermission();
      if (!granted) {
        Alert.alert('Permission denied', 'Allow contacts access in Settings to import.');
        return;
      }
      const imported = await importDeviceContacts();
      const existingPhones = new Set(contacts.map((c) => c.phone).filter(Boolean));
      const newOnes = imported.filter((c) => !c.phone || !existingPhones.has(c.phone));
      newOnes.forEach((c) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...rest } = c;
        addContact(rest);
      });
      Alert.alert('Import complete', `Added ${newOnes.length} new contact${newOnes.length !== 1 ? 's' : ''}.`);
    } catch (e) {
      Alert.alert('Import failed', 'Something went wrong. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleImport} disabled={importing}>
            {importing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="cloud-download-outline" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('AddEditContact', {})}
          >
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search contacts…"
          placeholderTextColor={Colors.textTertiary}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {contacts.length === 0 ? 'No contacts yet. Add one!' : 'No results.'}
            </Text>
          </View>
        ) : (
          filtered.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onPress={() => navigation.navigate('ContactDetail', { contactId: c.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
