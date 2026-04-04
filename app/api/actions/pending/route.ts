import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic');

  try {
    let result;
    if (topic) {
      result = await sql`
        SELECT 
          a.id,
          a.thread_id,
          a.update_id,
          a.description,
          a.status,
          a.created_at,
          a.resolved_at,
          t.title AS thread_title,
          t.topic AS thread_topic,
          t.agent AS agent,
          t.urgency AS urgency
        FROM actions a
        JOIN threads t ON a.thread_id = t.id
        WHERE 
          t.topic = ${topic}
          AND (
            a.status = 'pending'
            OR (
              a.status IN ('approved', 'rejected')
              AND a.resolved_at > NOW() - INTERVAL '5 minutes'
            )
          )
        ORDER BY a.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT 
          a.id,
          a.thread_id,
          a.update_id,
          a.description,
          a.status,
          a.created_at,
          a.resolved_at,
          t.title AS thread_title,
          t.topic AS thread_topic,
          t.agent AS agent,
          t.urgency AS urgency
        FROM actions a
        JOIN threads t ON a.thread_id = t.id
        WHERE 
          a.status = 'pending'
          OR (
            a.status IN ('approved', 'rejected')
            AND a.resolved_at > NOW() - INTERVAL '5 minutes'
          )
        ORDER BY a.created_at DESC
      `;
    }

    return NextResponse.json(result.rows, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('GET /api/actions/pending error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
