import * as ExpoContacts from 'expo-contacts';
import { Contact, RelationshipType } from '../types';
import { generateId, nowISO } from '../utils/dates';

export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await ExpoContacts.requestPermissionsAsync();
  return status === 'granted';
}

export async function importDeviceContacts(): Promise<Contact[]> {
  const { data } = await ExpoContacts.getContactsAsync({
    fields: [
      ExpoContacts.Fields.Name,
      ExpoContacts.Fields.PhoneNumbers,
      ExpoContacts.Fields.Emails,
      ExpoContacts.Fields.Birthday,
    ],
  });

  return data
    .filter((c) => c.name && c.name.trim().length > 0)
    .map((c) => mapDeviceContact(c));
}

function mapDeviceContact(c: ExpoContacts.Contact): Contact {
  const phone = c.phoneNumbers?.[0]?.number;
  const email = c.emails?.[0]?.email;

  let birthday: string | undefined;
  if (c.birthday) {
    const { month, day, year } = c.birthday;
    if (month !== undefined && day !== undefined) {
      birthday = year
        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        : `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const now = nowISO();
  return {
    id: generateId(),
    name: c.name!,
    phone: phone ? normalizePhone(phone) : undefined,
    email,
    relationship: 'acquaintance' as RelationshipType,
    interests: [],
    importantDates: [],
    birthday,
    checkInFrequencyDays: 0,
    voiceNotes: [],
    source: 'device',
    createdAt: now,
    updatedAt: now,
  };
}

function normalizePhone(raw: string): string {
  return raw.replace(/\s/g, '');
}
