import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await sql`
      SELECT dh.id, dh.digest_id, dh.raw_text, dh.bullet_count, dh.parsed_at, dh.source,
             json_agg(json_build_object(
               'id', t.id, 'topic', t.topic_tag, 'title', t.title,
               'body', t.body, 'section', t.section, 'urgency', t.urgency,
               'source', t.source, 'created_at', t.created_at
             ) ORDER BY t.created_at) AS bullets
      FROM digest_history dh
      LEFT JOIN threads t ON t.digest_id = dh.digest_id
      WHERE dh.digest_id = ${params.id}
      GROUP BY dh.id, dh.digest_id, dh.raw_text, dh.bullet_count, dh.parsed_at, dh.source
    `;
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.rows[0], { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
