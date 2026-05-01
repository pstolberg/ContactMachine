import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RelationshipType, VoiceNote, Contact } from '../types';
import { enrichContactFromNotes } from '../services/ai';
import { generateId, nowISO } from '../utils/dates';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'AddEditContact'>;

const RELATIONSHIPS: RelationshipType[] = ['friend', 'family', 'colleague', 'acquaintance', 'other'];
const FREQUENCIES = [
  { label: 'No cadence', days: 0 },
  { label: 'Weekly', days: 7 },
  { label: 'Every 2 weeks', days: 14 },
  { label: 'Monthly', days: 30 },
  { label: 'Every 2 months', days: 60 },
  { label: 'Quarterly', days: 90 },
];

export function AddEditContactScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { contacts, addContact, updateContact, settings } = useStore();
  const insets = useSafeAreaInsets();
  const isEditing = !!route.params?.contactId;
  const existing = contacts.find((c) => c.id === route.params?.contactId);

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [relationship, setRelationship] = useState<RelationshipType>(existing?.relationship ?? 'friend');
  const [howWeKnow, setHowWeKnow] = useState(existing?.howWeKnow ?? '');
  const [interestsText, setInterestsText] = useState(existing?.interests.join(', ') ?? '');
  const [birthday, setBirthday] = useState(existing?.birthday ?? '');
  const [checkInDays, setCheckInDays] = useState(existing?.checkInFrequencyDays ?? settings.defaultCheckInDays);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>(existing?.voiceNotes ?? []);
  const [enriching, setEnriching] = useState(false);

  async function handleEnrich() {
    if (!settings.anthropicApiKey) {
      Alert.alert('API key needed', 'Add your Anthropic API key in Settings to use AI features.');
      return;
    }
    const rawText = [notes, howWeKnow, interestsText].filter(Boolean).join('\n');
    if (!rawText.trim()) {
      Alert.alert('Add some notes', 'Write something about this person so AI can enrich the profile.');
      return;
    }
    setEnriching(true);
    try {
      const partial: Partial<Contact> = {
        id: existing?.id ?? '',
        name,
        relationship,
        howWeKnow,
        interests: interestsText.split(',').map((s) => s.trim()).filter(Boolean),
        notes,
        voiceNotes,
        importantDates: existing?.importantDates ?? [],
        checkInFrequencyDays: checkInDays,
        source: existing?.source ?? 'manual',
        createdAt: existing?.createdAt ?? nowISO(),
        updatedAt: nowISO(),
      };
      const enriched = await enrichContactFromNotes(
        settings.anthropicApiKey,
        partial as Contact,
        rawText,
      );
      if (enriched.interests) setInterestsText(enriched.interests.join(', '));
      if (enriched.howWeKnow) setHowWeKnow(enriched.howWeKnow);
      if (enriched.relationship) setRelationship(enriched.relationship as RelationshipType);
      Alert.alert('Profile enriched ✨', 'AI has updated the profile fields. Review and save when ready.');
    } catch (e: any) {
      Alert.alert('AI error', e.message ?? 'Something went wrong.');
    } finally {
      setEnriching(false);
    }
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this contact.');
      return;
    }

    const interests = interestsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      relationship,
      howWeKnow: howWeKnow.trim() || undefined,
      interests,
      birthday: birthday.trim() || undefined,
      checkInFrequencyDays: checkInDays,
      notes: notes.trim() || undefined,
      voiceNotes,
      importantDates: existing?.importantDates ?? [],
      source: existing?.source ?? ('manual' as const),
      aiSummary: existing?.aiSummary,
      lastContactDate: existing?.lastContactDate,
    };

    if (isEditing && existing) {
      updateContact(existing.id, payload);
    } else {
      addContact(payload);
    }
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit contact' : 'New contact'}</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Basic info */}
          <SectionLabel label="Basic info" />
          <Field label="Name *" value={name} onChangeText={setName} placeholder="Full name" />
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 555 000 0000" keyboardType="phone-pad" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />

          {/* Relationship */}
          <SectionLabel label="Relationship" />
          <View style={styles.chipRow}>
            {RELATIONSHIPS.map((r) => {
              const active = relationship === r;
              const badge = Colors.relationshipBadge[r];
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, active && { backgroundColor: badge.bg, borderColor: badge.text }]}
                  onPress={() => setRelationship(r)}
                >
                  <Text style={[styles.chipText, active && { color: badge.text }]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Field
            label="How you know them"
            value={howWeKnow}
            onChangeText={setHowWeKnow}
            placeholder="Met at a startup event in 2022…"
            multiline
          />

          {/* Interests */}
          <SectionLabel label="Context" />
          <Field
            label="Interests (comma-separated)"
            value={interestsText}
            onChangeText={setInterestsText}
            placeholder="hiking, startups, coffee…"
          />
          <Field
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything you want to remember…"
            multiline
          />

          {/* AI Enrich */}
          <TouchableOpacity
            style={[styles.enrichBtn, enriching && styles.enrichBtnLoading]}
            onPress={handleEnrich}
            disabled={enriching}
          >
            {enriching ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
            )}
            <Text style={styles.enrichBtnText}>
              {enriching ? 'Enriching…' : 'Enrich profile with AI'}
            </Text>
          </TouchableOpacity>

          {/* Dates */}
          <SectionLabel label="Important dates" />
          <Field
            label="Birthday (YYYY-MM-DD or MM-DD)"
            value={birthday}
            onChangeText={setBirthday}
            placeholder="1990-06-15 or 06-15"
          />

          {/* Check-in cadence */}
          <SectionLabel label="Check-in cadence" />
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.days}
                style={[styles.chip, checkInDays === f.days && styles.chipActive]}
                onPress={() => setCheckInDays(f.days)}
              >
                <Text style={[styles.chipText, checkInDays === f.days && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Voice notes */}
          <SectionLabel label="Voice notes" />
          <VoiceRecorder
            onVoiceNoteAdded={(note) => setVoiceNotes((prev) => [...prev, note])}
          />
          {voiceNotes.length > 0 && (
            <Text style={styles.voiceCount}>
              {voiceNotes.length} voice note{voiceNotes.length !== 1 ? 's' : ''} recorded
            </Text>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={sectionLabelStyle}>{label}</Text>;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

const sectionLabelStyle: any = {
  fontSize: 13,
  fontWeight: '600',
  color: Colors.textTertiary,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginTop: 20,
  marginBottom: 10,
};

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 5, fontWeight: '500' },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scroll: { padding: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', textTransform: 'capitalize' },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  enrichBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primaryLight,
    marginBottom: 4,
  },
  enrichBtnLoading: { opacity: 0.7 },
  enrichBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  voiceCount: { fontSize: 13, color: Colors.textSecondary, marginTop: 8 },
});
