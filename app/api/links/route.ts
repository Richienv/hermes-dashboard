import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, url, title, summary, topic, created_at
      FROM links
      ORDER BY created_at DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/links error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
