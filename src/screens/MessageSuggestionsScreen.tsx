import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Avatar } from '../components/Avatar';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MessageSuggestion } from '../types';
import { suggestMessages } from '../services/ai';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'MessageSuggestions'>;

export function MessageSuggestionsScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { contacts, settings, markContacted } = useStore();
  const insets = useSafeAreaInsets();

  const contact = contacts.find((c) => c.id === route.params.contactId);
  const [occasion, setOccasion] = useState('');
  const [suggestions, setSuggestions] = useState<MessageSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!settings.anthropicApiKey) {
      setError('Add your Anthropic API key in Settings to generate messages.');
      return;
    }
    if (!contact) return;
    setLoading(true);
    setError(null);
    try {
      const results = await suggestMessages(settings.anthropicApiKey, contact, occasion || undefined);
      setSuggestions(results);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong generating suggestions.');
    } finally {
      setLoading(false);
    }
  }, [contact, settings.anthropicApiKey, occasion]);

  useEffect(() => {
    generate();
  }, []);

  async function copyMessage(text: string) {
    try {
      await Share.share({ message: text });
    } catch {
      // user cancelled share sheet
    }
  }

  function sendViaWhatsApp(text: string) {
    if (!contact?.phone) {
      Alert.alert('No phone', 'Add a phone number to this contact first.');
      return;
    }
    const phone = contact.phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp not found', 'Please install WhatsApp to use this feature.');
    });
    markContacted(contact.id);
  }

  if (!contact) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Contact not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message ideas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Contact */}
        <View style={styles.contactRow}>
          <Avatar name={contact.name} size={40} />
          <Text style={styles.contactName}>{contact.name}</Text>
        </View>

        {/* Occasion input */}
        <View style={styles.occasionBox}>
          <Text style={styles.occasionLabel}>What's the occasion? (optional)</Text>
          <TextInput
            style={styles.occasionInput}
            value={occasion}
            onChangeText={setOccasion}
            placeholder="e.g. birthday, new job, just checking in…"
            placeholderTextColor={Colors.textTertiary}
            returnKeyType="done"
            onSubmitEditing={generate}
          />
        </View>

        {/* Regenerate */}
        <TouchableOpacity
          style={[styles.regenBtn, loading && styles.regenBtnDisabled]}
          onPress={generate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="refresh" size={15} color={Colors.primary} />
          )}
          <Text style={styles.regenBtnText}>{loading ? 'Generating…' : 'Generate suggestions'}</Text>
        </TouchableOpacity>

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Suggestions */}
        {suggestions.map((s, i) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.cardIndex}>Option {i + 1}</Text>
            <Text style={styles.cardText}>{s.text}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.cardBtn} onPress={() => copyMessage(s.text)}>
                <Ionicons name="share-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.cardBtnText}>Share</Text>
              </TouchableOpacity>
              {contact.phone && (
                <TouchableOpacity
                  style={[styles.cardBtn, styles.cardBtnWa]}
                  onPress={() => sendViaWhatsApp(s.text)}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#fff" />
                  <Text style={[styles.cardBtnText, { color: '#fff' }]}>Send via WhatsApp</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {!loading && suggestions.length === 0 && !error && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Tap "Generate suggestions" to get started.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: 16, paddingBottom: 48 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  contactName: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  occasionBox: { marginBottom: 14 },
  occasionLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  occasionInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primaryLight,
    marginBottom: 20,
    justifyContent: 'center',
  },
  regenBtnDisabled: { opacity: 0.6 },
  regenBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 14, color: Colors.error, flex: 1 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardIndex: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  cardText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22, marginBottom: 14 },
  cardActions: { flexDirection: 'row', gap: 8 },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.borderLight,
  },
  cardBtnWa: { backgroundColor: Colors.whatsapp, borderColor: Colors.whatsapp },
  cardBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
