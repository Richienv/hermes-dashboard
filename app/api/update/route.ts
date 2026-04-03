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
    const { thread_id, content, source_link } = await req.json();
    if (!thread_id || !content) {
      return NextResponse.json({ error: 'thread_id and content required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await sql`
      INSERT INTO updates (id, thread_id, content, source_link)
      VALUES (${id}, ${thread_id}, ${content}, ${source_link || null})
    `;

    return NextResponse.json({ id });
  } catch (error) {
    console.error('POST /api/update error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
