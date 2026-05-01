import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DigestItem } from '../types';
import { Avatar } from './Avatar';
import { Colors } from '../constants/colors';
import { generateDigestExplanation } from '../services/ai';

interface Props {
  item: DigestItem;
  onPress: () => void;
  onMessageSuggestions: () => void;
  apiKey?: string;
}

export function DigestCard({ item, onPress, onMessageSuggestions, apiKey }: Props) {
  const { contact, reasons } = item;
  const badge = Colors.relationshipBadge[contact.relationship];
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExpl, setLoadingExpl] = useState(false);

  async function loadExplanation() {
    if (!apiKey || explanation || loadingExpl) return;
    setLoadingExpl(true);
    try {
      const text = await generateDigestExplanation(apiKey, contact.name, reasons);
      setExplanation(text);
    } catch {
      // silently skip — reasons are shown as fallback
    } finally {
      setLoadingExpl(false);
    }
  }

  React.useEffect(() => {
    loadExplanation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openWhatsApp() {
    if (!contact.phone) return;
    const phone = contact.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.header}>
        <Avatar name={contact.name} size={46} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{contact.name}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {contact.relationship}
            </Text>
          </View>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.reasonBox}>
        {loadingExpl ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={styles.reasonText}>
            {explanation ?? reasons[0]}
          </Text>
        )}
      </View>

      {/* Extra reasons */}
      {reasons.length > 1 && !explanation && (
        <View style={styles.extraReasons}>
          {reasons.slice(1).map((r, i) => (
            <View key={i} style={styles.reasonChip}>
              <Text style={styles.reasonChipText}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onMessageSuggestions}>
          <Ionicons name="sparkles" size={15} color={Colors.primary} />
          <Text style={styles.actionBtnText}>Message ideas</Text>
        </TouchableOpacity>

        {contact.phone ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.waBtn]}
            onPress={openWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={15} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reasonBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  reasonText: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: '500',
    lineHeight: 20,
  },
  extraReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reasonChip: {
    backgroundColor: Colors.borderLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reasonChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  waBtn: {
    borderColor: Colors.whatsapp,
    backgroundColor: Colors.whatsapp,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
