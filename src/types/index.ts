export type RelationshipType = 'friend' | 'family' | 'colleague' | 'acquaintance' | 'other';

export interface ImportantDate {
  id: string;
  label: string;
  /** YYYY-MM-DD for one-off, MM-DD for recurring annual events */
  date: string;
  recurring: boolean;
}

export interface VoiceNote {
  id: string;
  uri: string;
  /** Duration in seconds */
  duration?: number;
  transcript?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;

  relationship: RelationshipType;
  /** Free-text: "Met at a startup event in 2022" */
  howWeKnow?: string;
  interests: string[];
  notes?: string;

  /** YYYY-MM-DD or MM-DD */
  birthday?: string;
  importantDates: ImportantDate[];

  /** 0 = no specific cadence */
  checkInFrequencyDays: number;
  /** ISO date string of last message / interaction */
  lastContactDate?: string;

  /** AI-generated profile summary */
  aiSummary?: string;

  voiceNotes: VoiceNote[];

  source: 'manual' | 'device' | 'google' | 'facebook';

  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  anthropicApiKey?: string;
  userName?: string;
  notificationsEnabled: boolean;
  /** 0-23 */
  notificationHour: number;
  notificationMinute: number;
  /** Default check-in frequency in days for new contacts */
  defaultCheckInDays: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  notificationHour: 8,
  notificationMinute: 0,
  defaultCheckInDays: 14,
};

export interface DigestItem {
  contact: Contact;
  reasons: string[];
  urgency: number;
}

export interface MessageSuggestion {
  id: string;
  text: string;
}
