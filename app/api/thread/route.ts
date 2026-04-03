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
    const { topic, title } = await req.json();
    if (!topic || !title) {
      return NextResponse.json({ error: 'topic and title required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await sql`
      INSERT INTO threads (id, topic, title)
      VALUES (${id}, ${topic}, ${title})
    `;

    return NextResponse.json({ id });
  } catch (error) {
    console.error('POST /api/thread error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
