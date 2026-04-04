// lib/parseDigest.ts

export type DigestItem = {
  topic: string;
  title: string;
  body: string;
  section: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  actionRequired: boolean;
  action: string | null;
  digestId: string;
  topicTag: string;
};

const SECTION_MAP: Record<string, { key: string; urgency: 'HIGH' | 'MEDIUM' | 'LOW' }> = {
  '🔴': { key: 'AKSI_HARI_INI', urgency: 'HIGH' },
  '🟡': { key: 'MINGGU_INI', urgency: 'MEDIUM' },
  '🟢': { key: 'DICATAT', urgency: 'LOW' },
  '🔍': { key: 'TEMUAN', urgency: 'LOW' },
  '📅': { key: 'JADWAL', urgency: 'LOW' },
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  OIC: ['OIC', 'hardware', 'ESP32', 'GC9A01', 'desk companion', 'polycarbonate'],
  ERP: ['ERP', 'Mekari', 'Coretax', 'pajak', 'garmen', 'tekstil', 'UMKM', 'SME'],
  Personal: ['HSK', 'Mandarin', 'Renita', 'kuliah', 'ZJU'],
};

function inferTopic(text: string): string {
  const upper = text.toUpperCase();
  // Check for explicit topic tags like [OIC] or [ERP]
  const tagMatch = text.match(/\[(OIC|ERP|PERSONAL|GENERAL)\]/i);
  if (tagMatch) {
    const tag = tagMatch[1].toUpperCase();
    if (tag === 'OIC') return 'OIC';
    if (tag === 'ERP') return 'ERP';
    if (tag === 'PERSONAL') return 'Personal';
    return 'General';
  }

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => upper.includes(kw.toUpperCase()))) return topic;
  }
  return 'General';
}

function inferSource(text: string): string {
  if (text.includes('[ARIA]') || text.includes('ARIA')) return 'ARIA';
  if (text.includes('[ICARUS]') || text.includes('ICARUS')) return 'ICARUS';
  if (text.includes('[DAEDALUS]')) return 'DAEDALUS';
  if (text.includes('[GHOST]')) return 'GHOST';
  if (text.includes('[SCHOLAR]')) return 'SCHOLAR';
  return 'SYSTEM';
}

export function parseDigest(digestText: string): DigestItem[] {
  const digestId = new Date().toISOString().slice(0, 16).replace('T', '-');
  const items: DigestItem[] = [];

  const lines = digestText.split('\n');
  let currentSection = 'DICATAT';
  let currentUrgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect section header
    for (const [emoji, meta] of Object.entries(SECTION_MAP)) {
      if (trimmed.startsWith(emoji)) {
        currentSection = meta.key;
        currentUrgency = meta.urgency;
        break;
      }
    }

    // Detect bullet items (•, -, *, or numbered)
    const bulletMatch = trimmed.match(/^[•\-\*]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/);
    if (bulletMatch) {
      const bulletText = bulletMatch[1];

      // Split into title and body: first sentence or em-dash or newline
      const dashSplit = bulletText.split(/\s*—\s*|\s*–\s*/);
      const title = dashSplit[0].trim().replace(/\[.*?\]\s*/g, '').slice(0, 120);
      const body = dashSplit.slice(1).join(' — ').trim().slice(0, 500);

      const topic = inferTopic(bulletText);
      const source = inferSource(bulletText);
      const actionRequired = /AKSI|action needed|harus|wajib|segera/i.test(bulletText);

      items.push({
        topic,
        title: title || bulletText.slice(0, 100),
        body,
        section: currentSection,
        urgency: currentUrgency,
        source,
        actionRequired,
        action: actionRequired ? `Review: ${title}` : null,
        digestId,
        topicTag: topic,
      });
    }
  }

  return items;
}

// POST all parsed items to the dashboard API
export async function postDigestToDashboard(
  items: DigestItem[],
  baseUrl: string,
  apiKey: string
): Promise<void> {
  for (const item of items) {
    try {
      await fetch(`${baseUrl}/api/thread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hermes-Key': apiKey },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error('Failed to post digest item:', err);
    }
  }
}
