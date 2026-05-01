import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Avatar } from '../components/Avatar';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { friendlyAgo, daysUntilNextOccurrence } from '../utils/dates';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'ContactDetail'>;

export function ContactDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { contacts, deleteContact, markContacted } = useStore();
  const insets = useSafeAreaInsets();

  const contact = contacts.find((c) => c.id === route.params.contactId);

  if (!contact) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Contact not found.</Text>
      </View>
    );
  }

  const badge = Colors.relationshipBadge[contact.relationship];

  function openWhatsApp() {
    if (!contact!.phone) return;
    const phone = contact!.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  }

  function callContact() {
    if (!contact!.phone) return;
    Linking.openURL(`tel:${contact!.phone}`);
  }

  function emailContact() {
    if (!contact!.email) return;
    Linking.openURL(`mailto:${contact!.email}`);
  }

  function handleDelete() {
    Alert.alert(
      'Delete contact',
      `Remove ${contact!.name} from ContactMachine? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteContact(contact!.id);
            navigation.goBack();
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate('AddEditContact', { contactId: contact.id })}
          >
            <Ionicons name="pencil" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <Avatar name={contact.name} size={80} />
          <Text style={styles.name}>{contact.name}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{contact.relationship}</Text>
          </View>
          {contact.howWeKnow && (
            <Text style={styles.howWeKnow}>{contact.howWeKnow}</Text>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {contact.phone && (
            <>
              <TouchableOpacity style={styles.qBtn} onPress={callContact}>
                <Ionicons name="call" size={20} color={Colors.primary} />
                <Text style={styles.qBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.qBtn, styles.qBtnWhatsApp]} onPress={openWhatsApp}>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={[styles.qBtnText, { color: '#fff' }]}>WhatsApp</Text>
              </TouchableOpacity>
            </>
          )}
          {contact.email && (
            <TouchableOpacity style={styles.qBtn} onPress={emailContact}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
              <Text style={styles.qBtnText}>Email</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.qBtn, styles.qBtnPrimary]}
            onPress={() => navigation.navigate('MessageSuggestions', { contactId: contact.id })}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={[styles.qBtnText, { color: '#fff' }]}>Message ideas</Text>
          </TouchableOpacity>
        </View>

        {/* AI Summary */}
        {contact.aiSummary && (
          <Section title="Summary">
            <Text style={styles.bodyText}>{contact.aiSummary}</Text>
          </Section>
        )}

        {/* Interests */}
        {contact.interests.length > 0 && (
          <Section title="Interests">
            <View style={styles.tags}>
              {contact.interests.map((interest, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Contact info */}
        <Section title="Contact info">
          {contact.phone && (
            <Row icon="call-outline" label="Phone" value={contact.phone} />
          )}
          {contact.email && (
            <Row icon="mail-outline" label="Email" value={contact.email} />
          )}
          {!contact.phone && !contact.email && (
            <Text style={styles.bodyText}>No contact info added.</Text>
          )}
        </Section>

        {/* Check-in */}
        <Section title="Check-in cadence">
          <Row
            icon="time-outline"
            label="Frequency"
            value={
              contact.checkInFrequencyDays > 0
                ? `Every ${contact.checkInFrequencyDays} days`
                : 'No specific cadence'
            }
          />
          {contact.lastContactDate && (
            <Row
              icon="chatbubble-outline"
              label="Last contact"
              value={friendlyAgo(contact.lastContactDate)}
            />
          )}
          {contact.birthday && (
            <Row
              icon="gift-outline"
              label="Birthday"
              value={`in ${daysUntilNextOccurrence(contact.birthday)} days`}
            />
          )}
          <TouchableOpacity style={styles.markedBtn} onPress={() => markContacted(contact.id)}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.markedText}>Mark as contacted today</Text>
          </TouchableOpacity>
        </Section>

        {/* Notes */}
        {contact.notes && (
          <Section title="Notes">
            <Text style={styles.bodyText}>{contact.notes}</Text>
          </Section>
        )}

        {/* Voice notes */}
        {contact.voiceNotes.length > 0 && (
          <Section title={`Voice notes (${contact.voiceNotes.length})`}>
            {contact.voiceNotes.map((vn) => (
              <View key={vn.id} style={styles.voiceRow}>
                <Ionicons name="mic" size={16} color={Colors.primary} />
                <Text style={styles.voiceMeta}>
                  {new Date(vn.createdAt).toLocaleDateString()}{vn.duration ? ` · ${vn.duration}s` : ''}
                </Text>
                {vn.transcript && (
                  <Text style={styles.voiceTranscript} numberOfLines={2}>
                    {vn.transcript}
                  </Text>
                )}
              </View>
            ))}
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={rowStyles.row}>
      <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  body: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  label: { fontSize: 14, color: Colors.textSecondary, width: 80 },
  value: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: Colors.textSecondary },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  navActions: { flexDirection: 'row' },
  scroll: { padding: 16, paddingBottom: 48 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  name: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 12, marginBottom: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  howWeKnow: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  qBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  qBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  qBtnWhatsApp: { backgroundColor: Colors.whatsapp, borderColor: Colors.whatsapp },
  qBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  bodyText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  markedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  markedText: { fontSize: 14, color: Colors.success, fontWeight: '500' },
  voiceRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  voiceMeta: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  voiceTranscript: { fontSize: 13, color: Colors.textPrimary, marginTop: 4, fontStyle: 'italic' },
});
