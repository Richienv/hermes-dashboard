import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic') || 'General';

  try {
    // Get threads for topic
    const threadsResult = await sql`
      SELECT id, topic, title, created_at
      FROM threads
      WHERE topic = ${topic}
      ORDER BY created_at DESC
    `;

    const threads = threadsResult.rows;

    if (threads.length === 0) {
      return NextResponse.json([]);
    }

    // Get updates for these threads via JOIN
    const updatesResult = await sql`
      SELECT u.id, u.thread_id, u.content, u.source_link, u.created_at
      FROM updates u
      INNER JOIN threads t ON u.thread_id = t.id
      WHERE t.topic = ${topic}
      ORDER BY u.created_at DESC
    `;

    // Get actions for these threads via JOIN
    const actionsResult = await sql`
      SELECT a.id, a.thread_id, a.update_id, a.description, a.status, a.created_at, a.resolved_at
      FROM actions a
      INNER JOIN threads t ON a.thread_id = t.id
      WHERE t.topic = ${topic}
      ORDER BY a.created_at DESC
    `;

    // Build nested structure
    const actionsByUpdate: Record<string, typeof actionsResult.rows> = {};
    const actionsByThread: Record<string, typeof actionsResult.rows> = {};

    for (const action of actionsResult.rows) {
      if (action.update_id) {
        if (!actionsByUpdate[action.update_id]) actionsByUpdate[action.update_id] = [];
        actionsByUpdate[action.update_id].push(action);
      } else {
        if (!actionsByThread[action.thread_id]) actionsByThread[action.thread_id] = [];
        actionsByThread[action.thread_id].push(action);
      }
    }

    const updatesByThread: Record<string, typeof updatesResult.rows> = {};
    for (const update of updatesResult.rows) {
      if (!updatesByThread[update.thread_id]) updatesByThread[update.thread_id] = [];
      updatesByThread[update.thread_id].push({
        ...update,
        actions: actionsByUpdate[update.id] || [],
      });
    }

    const result = threads.map(thread => ({
      ...thread,
      updates: updatesByThread[thread.id] || [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
