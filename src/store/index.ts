import { create } from 'zustand';
import { Contact, AppSettings, DEFAULT_SETTINGS } from '../types';
import {
  loadContacts,
  saveContacts,
  loadSettings,
  saveSettings,
} from '../services/database';
import { generateId, nowISO } from '../utils/dates';

interface AppStore {
  contacts: Contact[];
  settings: AppSettings;
  isInitialized: boolean;

  initialize: () => Promise<void>;

  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  markContacted: (id: string) => void;

  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  contacts: [],
  settings: DEFAULT_SETTINGS,
  isInitialized: false,

  initialize: async () => {
    const [contacts, settings] = await Promise.all([loadContacts(), loadSettings()]);
    set({ contacts, settings, isInitialized: true });
  },

  addContact: (contact) => {
    const now = nowISO();
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const contacts = [...get().contacts, newContact];
    set({ contacts });
    saveContacts(contacts);
  },

  updateContact: (id, updates) => {
    const contacts = get().contacts.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: nowISO() } : c,
    );
    set({ contacts });
    saveContacts(contacts);
  },

  deleteContact: (id) => {
    const contacts = get().contacts.filter((c) => c.id !== id);
    set({ contacts });
    saveContacts(contacts);
  },

  markContacted: (id) => {
    const contacts = get().contacts.map((c) =>
      c.id === id ? { ...c, lastContactDate: nowISO(), updatedAt: nowISO() } : c,
    );
    set({ contacts });
    saveContacts(contacts);
  },

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    set({ settings });
    saveSettings(settings);
  },
}));
