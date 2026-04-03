import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

function checkAuth(req: NextRequest): boolean {
  const key = req.headers.get('X-Hermes-Key');
  return key === process.env.HERMES_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url, title, summary, topic } = await req.json();
    if (!url || !title) {
      return NextResponse.json({ error: 'url and title required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await sql`
      INSERT INTO links (id, url, title, summary, topic)
      VALUES (${id}, ${url}, ${title}, ${summary || null}, ${topic || null})
    `;

    return NextResponse.json({ id });
  } catch (error) {
    console.error('POST /api/link error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
