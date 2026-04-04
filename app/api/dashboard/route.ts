import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

const SECTION_META: Record<string, { label: string; order: number }> = {
  PRIORITAS:     { label: '🔴 PRIORITAS',    order: 0 },
  AKSI_HARI_INI: { label: '🔴 AKSI HARI INI', order: 1 },
  MINGGU_INI:    { label: '🟡 MINGGU INI',    order: 2 },
  DICATAT:       { label: '🟢 DICATAT',       order: 3 },
  TEMUAN:        { label: '🔍 TEMUAN',        order: 4 },
  JADWAL:        { label: '📅 JADWAL',        order: 5 },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic');
  const agent = searchParams.get('agent');
  const flat = searchParams.get('flat') === 'true';

  try {
    // Build query with optional filters
    let threadsResult;
    if (topic && agent) {
      threadsResult = await sql`
        SELECT t.id, t.topic, t.title, t.body, t.section, t.urgency, t.source,
               t.action_required, t.digest_id, t.topic_tag, t.created_at, t.agent
        FROM threads t
        WHERE t.topic = ${topic} AND (t.agent = ${agent} OR t.source = ${agent})
        ORDER BY t.created_at DESC
      `;
    } else if (topic) {
      threadsResult = await sql`
        SELECT t.id, t.topic, t.title, t.body, t.section, t.urgency, t.source,
               t.action_required, t.digest_id, t.topic_tag, t.created_at, t.agent
        FROM threads t
        WHERE t.topic = ${topic}
        ORDER BY t.created_at DESC
      `;
    } else if (agent) {
      threadsResult = await sql`
        SELECT t.id, t.topic, t.title, t.body, t.section, t.urgency, t.source,
               t.action_required, t.digest_id, t.topic_tag, t.created_at, t.agent
        FROM threads t
        WHERE t.agent = ${agent} OR t.source = ${agent}
        ORDER BY t.created_at DESC
      `;
    } else {
      threadsResult = await sql`
        SELECT t.id, t.topic, t.title, t.body, t.section, t.urgency, t.source,
               t.action_required, t.digest_id, t.topic_tag, t.created_at, t.agent
        FROM threads t
        ORDER BY t.created_at DESC
      `;
    }

    if (threadsResult.rows.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    // Get actions for all threads
    let actionsResult;
    if (topic) {
      actionsResult = await sql`
        SELECT a.id, a.thread_id, a.description, a.status, a.created_at, a.resolved_at
        FROM actions a
        INNER JOIN threads t ON a.thread_id = t.id
        WHERE t.topic = ${topic}
        ORDER BY a.created_at DESC
      `;
    } else {
      actionsResult = await sql`
        SELECT a.id, a.thread_id, a.description, a.status, a.created_at, a.resolved_at
        FROM actions a
        ORDER BY a.created_at DESC
      `;
    }

    const actionsByThread: Record<string, typeof actionsResult.rows> = {};
    for (const a of actionsResult.rows) {
      if (!actionsByThread[a.thread_id]) actionsByThread[a.thread_id] = [];
      actionsByThread[a.thread_id].push(a);
    }

    // If flat=true, return flat array (for new feed layout)
    if (flat) {
      const result = threadsResult.rows.map(thread => ({
        ...thread,
        actions: actionsByThread[thread.id] || [],
      }));
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    // Otherwise, group by section (for backward compatibility)
    const grouped: Record<string, { items: typeof threadsResult.rows }> = {};
    for (const thread of threadsResult.rows) {
      const sec = thread.section || 'DICATAT';
      if (!grouped[sec]) grouped[sec] = { items: [] };
      grouped[sec].items.push({ ...thread, actions: actionsByThread[thread.id] || [] });
    }

    const result = Object.entries(grouped)
      .map(([section, { items }]) => ({
        section,
        label: SECTION_META[section]?.label ?? section,
        order: SECTION_META[section]?.order ?? 99,
        items,
      }))
      .sort((a, b) => a.order - b.order)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ order: _order, ...rest }) => rest);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
