import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

function checkAuth(req: NextRequest): boolean {
  const key = req.headers.get('X-Hermes-Key');
  return key === process.env.HERMES_API_KEY;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status } = await req.json();
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 });
    }

    await sql`
      UPDATE actions
      SET status = ${status}, resolved_at = NOW()
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('PATCH /api/action/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
