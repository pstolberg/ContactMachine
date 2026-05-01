import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Contact } from '../types';
import { Avatar } from './Avatar';
import { Colors } from '../constants/colors';
import { friendlyAgo, daysSince } from '../utils/dates';

interface Props {
  contact: Contact;
  onPress: () => void;
}

export function ContactCard({ contact, onPress }: Props) {
  const badge = Colors.relationshipBadge[contact.relationship];
  const isOverdue =
    contact.checkInFrequencyDays > 0 &&
    contact.lastContactDate &&
    daysSince(contact.lastContactDate) > contact.checkInFrequencyDays;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <Avatar name={contact.name} size={48} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {contact.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {contact.relationship}
            </Text>
          </View>
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {contact.lastContactDate
            ? `Last contact ${friendlyAgo(contact.lastContactDate)}`
            : 'Never contacted'}
        </Text>
      </View>
      {isOverdue && (
        <View style={styles.overdueDot} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  overdueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning,
    marginLeft: 8,
  },
});
