import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS body TEXT`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'DICATAT'`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'LOW'`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'SYSTEM'`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS digest_id TEXT`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS topic_tag TEXT`;
    return NextResponse.json({ ok: true, message: 'Migration complete' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
