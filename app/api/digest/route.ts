import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

function checkAuth(req: NextRequest) {
  return req.headers.get('X-Hermes-Key') === process.env.HERMES_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { digestId, rawText, bulletCount, source } = await req.json();
    if (!digestId || !rawText) return NextResponse.json({ error: 'digestId and rawText required' }, { status: 400 });
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO digest_history (id, digest_id, raw_text, bullet_count, source)
      VALUES (${id}, ${digestId}, ${rawText}, ${bulletCount ?? 0}, ${source ?? 'SYSTEM'})
      ON CONFLICT (digest_id) DO UPDATE SET raw_text = EXCLUDED.raw_text, bullet_count = EXCLUDED.bullet_count
    `;
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await sql`
      SELECT id, digest_id, bullet_count, parsed_at, source
      FROM digest_history
      ORDER BY parsed_at DESC
      LIMIT 50
    `;
    return NextResponse.json(result.rows, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
