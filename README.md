# ContactMachine

Stay personally connected with your network — at scale, without losing the human touch.

## What it does

- **Daily digest** — every morning, a shortlist of who to reach out to today, ranked by check-in cadence, birthdays, and other signals
- **Contact profiles** — rich context about each person: how you know them, shared interests, important dates, your notes
- **AI message suggestions** — tap "Message ideas" and Claude generates 4 personalised, specific messages for that person
- **AI profile enrichment** — describe a contact in free text or a voice note; AI extracts structured profile data
- **Voice notes** — record a quick memo about a contact and add a transcript for AI processing
- **WhatsApp integration** — send any suggested message directly via WhatsApp with one tap
- **Device contacts import** — bulk-import from your phone and enrich from there
- **Daily notification** — morning push notification when you have people to reach out to

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo 51 |
| Navigation | React Navigation (bottom tabs + native stack) |
| State | Zustand |
| Storage | AsyncStorage (local, on-device) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via direct API |
| Notifications | Expo Notifications |
| Voice recording | Expo AV |
| Contacts import | Expo Contacts |

## Getting started

```bash
# Install dependencies
npm install

# Start dev server (choose iOS / Android / Web)
npx expo start
```

### Anthropic API key

Open the app → **Settings** → paste your Anthropic API key. It's stored locally using Expo SecureStore and is only sent to `api.anthropic.com`.

Alternatively, set it in `.env`:
```
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

## Project structure

```
src/
├── types/          # TypeScript interfaces (Contact, AppSettings, …)
├── constants/      # Colors and design tokens
├── utils/
│   ├── avatars.ts  # Initials + avatar colour from name hash
│   ├── dates.ts    # Date helpers (daysUntil, daysSince, friendlyAgo)
│   └── digest.ts   # Daily digest scoring algorithm
├── services/
│   ├── ai.ts             # Anthropic API: enrich, suggest, explain
│   ├── database.ts       # AsyncStorage CRUD
│   ├── notifications.ts  # Expo Notifications scheduling
│   └── contactsImport.ts # Device contacts import
├── store/          # Zustand store (contacts + settings)
├── navigation/     # React Navigation setup
├── screens/
│   ├── HomeScreen.tsx              # Daily digest
│   ├── ContactsScreen.tsx          # Contact list + search + filter
│   ├── ContactDetailScreen.tsx     # Full profile
│   ├── AddEditContactScreen.tsx    # Create / edit + voice notes + AI enrich
│   ├── MessageSuggestionsScreen.tsx # AI message ideas
│   └── SettingsScreen.tsx          # API key, notifications, defaults
└── components/
    ├── Avatar.tsx        # Initials circle
    ├── ContactCard.tsx   # List item for contacts screen
    ├── DigestCard.tsx    # Rich card for home screen digest
    └── VoiceRecorder.tsx # Record / stop audio memo
```

## Daily digest algorithm

Each contact is scored by urgency:

| Signal | Points |
|---|---|
| Birthday today | 100 |
| Birthday tomorrow | 90 |
| Birthday in N days (≤7) | 70–83 |
| Overdue check-in | 50–70 (grows with days overdue) |
| Never contacted | 25–40 |
| Important date (recurring) in ≤7 days | 50–60 |

Top 5 are shown each day.

## Integrations roadmap

| Integration | Status |
|---|---|
| WhatsApp (send) | ✅ Deep link (`whatsapp://send`) |
| Device contacts | ✅ Expo Contacts |
| Anthropic AI | ✅ REST API |
| Push notifications | ✅ Expo Notifications |
| Gmail | 🔧 Planned (OAuth + People API) |
| Google Contacts | 🔧 Planned (OAuth + People API) |
| Facebook | 🔧 Planned (Graph API) |
| WhatsApp history import | 🔧 Planned (WhatsApp Business API) |
