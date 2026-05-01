import { Contact, DigestItem } from '../types';
import { daysSince, daysUntilNextOccurrence } from './dates';

const MAX_DIGEST = 5;

function scoreContact(contact: Contact): { urgency: number; reasons: string[] } {
  let urgency = 0;
  const reasons: string[] = [];

  // Birthday
  if (contact.birthday) {
    const days = daysUntilNextOccurrence(contact.birthday);
    if (days === 0) {
      reasons.push("🎂 Birthday today!");
      urgency += 100;
    } else if (days === 1) {
      reasons.push("🎂 Birthday tomorrow");
      urgency += 90;
    } else if (days <= 7) {
      reasons.push(`🎂 Birthday in ${days} days`);
      urgency += 70 + (7 - days) * 3;
    }
  }

  // Other important dates
  for (const d of contact.importantDates) {
    if (!d.recurring) continue;
    const days = daysUntilNextOccurrence(d.date);
    if (days === 0) {
      reasons.push(`🗓 ${d.label} today!`);
      urgency += 80;
    } else if (days <= 7) {
      reasons.push(`🗓 ${d.label} in ${days} day${days !== 1 ? 's' : ''}`);
      urgency += 50;
    }
  }

  // Check-in cadence
  if (contact.checkInFrequencyDays > 0) {
    if (contact.lastContactDate) {
      const ago = daysSince(contact.lastContactDate);
      const overdue = ago - contact.checkInFrequencyDays;
      if (overdue >= 0) {
        const label =
          ago === 0
            ? 'today'
            : ago === 1
            ? 'yesterday'
            : `${ago} days ago`;
        reasons.push(`💬 Last spoke ${label} (due every ${contact.checkInFrequencyDays}d)`);
        urgency += Math.min(50 + overdue * 2, 70);
      }
    } else {
      reasons.push("👋 New contact — say hello!");
      urgency += 40;
    }
  } else if (!contact.lastContactDate) {
    reasons.push("👋 Haven't reached out yet");
    urgency += 25;
  }

  return { urgency, reasons };
}

export function computeDigest(contacts: Contact[]): DigestItem[] {
  const items: DigestItem[] = [];

  for (const contact of contacts) {
    const { urgency, reasons } = scoreContact(contact);
    if (urgency > 0) {
      items.push({ contact, reasons, urgency });
    }
  }

  return items.sort((a, b) => b.urgency - a.urgency).slice(0, MAX_DIGEST);
}
