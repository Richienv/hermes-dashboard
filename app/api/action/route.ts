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
    const { thread_id, update_id, description } = await req.json();
    if (!thread_id || !description) {
      return NextResponse.json({ error: 'thread_id and description required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await sql`
      INSERT INTO actions (id, thread_id, update_id, description, status)
      VALUES (${id}, ${thread_id}, ${update_id || null}, ${description}, 'pending')
    `;

    return NextResponse.json({ id });
  } catch (error) {
    console.error('POST /api/action error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
