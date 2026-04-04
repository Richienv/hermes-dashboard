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
  const upper = text.toUpperCase();
  // Only assign if agent name is EXPLICITLY present as a word
  if (/\bARIA\b/.test(upper)) return 'ARIA';
  if (/\bICARUS\b/.test(upper)) return 'ICARUS';
  if (/\bDAEDALUS\b/.test(upper)) return 'DAEDALUS';
  if (/\bGHOST\b/.test(upper)) return 'GHOST';
  if (/\bSCHOLAR\b/.test(upper)) return 'SCHOLAR';
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

      // Override: deadline/schedule items must not land in TEMUAN
      let effectiveSection = currentSection;
      let effectiveUrgency = currentUrgency;
      const deadlinePattern = /\bdue\b|\bdeadline\b|\bD-\d+\b|\bjatuh tempo\b|\btengat\b/i;
      if (effectiveSection === 'TEMUAN' && deadlinePattern.test(bulletText)) {
        effectiveSection = 'MINGGU_INI';
        effectiveUrgency = 'MEDIUM';
      }

      // Override: AKSI_HARI_INI with future date but no urgency markers → MINGGU_INI
      const futureDatePattern = /\b\d{1,2}\s+(Mei|April|Maret|Juni|Juli|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\bMay \d+|\bApril \d+/i;
      const urgencyMarkers = /\bsekarang\b|\bhari ini\b|\bsegera\b|\bimmediately\b|\btoday\b/i;
      if (effectiveSection === 'AKSI_HARI_INI' && futureDatePattern.test(bulletText) && !urgencyMarkers.test(bulletText)) {
        effectiveSection = 'MINGGU_INI';
        effectiveUrgency = 'MEDIUM';
      }

      items.push({
        topic,
        title: title || bulletText.slice(0, 100),
        body,
        section: effectiveSection,
        urgency: effectiveUrgency,
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

// POST digest history record
export async function postDigestHistory(
  digestText: string,
  digestId: string,
  bulletCount: number,
  baseUrl: string,
  apiKey: string
): Promise<void> {
  try {
    await fetch(`${baseUrl}/api/digest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hermes-Key': apiKey },
      body: JSON.stringify({ digestId, rawText: digestText, bulletCount, source: 'SYSTEM' }),
    });
  } catch (err) {
    console.error('Failed to post digest history:', err);
  }
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
