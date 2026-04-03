import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        a.id,
        a.thread_id,
        a.update_id,
        a.description,
        a.status,
        a.created_at,
        a.resolved_at,
        t.title AS thread_title,
        t.topic AS thread_topic
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

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/actions/pending error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
