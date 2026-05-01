import { Contact, MessageSuggestion } from '../types';
import { generateId } from '../utils/dates';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

async function callClaude(apiKey: string, prompt: string, maxTokens = 1024): Promise<string> {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  return (data.content[0] as { text: string }).text;
}

/** Enrich a contact profile from free-form notes. Returns partial Contact fields to merge. */
export async function enrichContactFromNotes(
  apiKey: string,
  contact: Contact,
  rawNotes: string,
): Promise<Partial<Contact>> {
  const prompt = `You help maintain a personal CRM. Given these notes about a contact, extract structured information.

Contact name: ${contact.name}
Raw notes: ${rawNotes}

Return ONLY valid JSON (no markdown, no explanation) with these optional fields:
{
  "aiSummary": "2–3 sentence narrative about who this person is and the relationship",
  "interests": ["string", ...],
  "howWeKnow": "one sentence",
  "relationship": "friend|family|colleague|acquaintance|other"
}

Only include fields you can confidently infer. If nothing can be inferred for a field, omit it.`;

  const text = await callClaude(apiKey, prompt, 512);

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as Partial<Contact>;
  } catch {
    return { aiSummary: text.slice(0, 300) };
  }
}

/** Generate personalised message suggestions for a contact. */
export async function suggestMessages(
  apiKey: string,
  contact: Contact,
  occasion?: string,
): Promise<MessageSuggestion[]> {
  const contextParts: string[] = [
    `Name: ${contact.name}`,
    `Relationship: ${contact.relationship}`,
  ];
  if (contact.howWeKnow) contextParts.push(`How you know them: ${contact.howWeKnow}`);
  if (contact.interests.length) contextParts.push(`Interests: ${contact.interests.join(', ')}`);
  if (contact.aiSummary) contextParts.push(`Context: ${contact.aiSummary}`);
  if (contact.notes) contextParts.push(`Recent notes: ${contact.notes.slice(0, 400)}`);

  const prompt = `You help someone maintain genuine personal relationships. Write 4 short, warm, authentic message options.

${contextParts.join('\n')}
${occasion ? `Occasion: ${occasion}` : 'Occasion: general check-in'}

Rules:
- Each message is 1–3 sentences, casual and natural — as if texting a real friend
- No generic phrases like "Hope you're well!" or "Just checking in"
- Reference specific details about this person where possible
- Vary the tone across the 4 messages (playful, warm, thoughtful, curious)

Return ONLY a JSON array of 4 strings. No markdown, no explanation.`;

  const text = await callClaude(apiKey, prompt, 512);

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const arr = JSON.parse(cleaned) as string[];
    return arr.map((t) => ({ id: generateId(), text: t }));
  } catch {
    // Fallback: split on newlines if JSON fails
    const lines = text
      .split('\n')
      .map((l) => l.replace(/^[\d\-\.\)]+\s*/, '').trim())
      .filter((l) => l.length > 10)
      .slice(0, 4);
    return lines.map((t) => ({ id: generateId(), text: t }));
  }
}

/** Generate a one-line explanation of why to reach out today. */
export async function generateDigestExplanation(
  apiKey: string,
  contactName: string,
  reasons: string[],
): Promise<string> {
  const prompt = `In one casual, friendly sentence explain why someone should reach out to ${contactName} today.
Context: ${reasons.join('; ')}
Return only the sentence, no quotes.`;

  const text = await callClaude(apiKey, prompt, 128);
  return text.trim().replace(/^["']|["']$/g, '');
}
