import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS updates (
        id TEXT PRIMARY KEY,
        thread_id TEXT REFERENCES threads(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        source_link TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        thread_id TEXT REFERENCES threads(id) ON DELETE CASCADE,
        update_id TEXT REFERENCES updates(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        topic TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS assignment_attachments (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_data BYTEA NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    return NextResponse.json({ ok: true, message: 'Tables created successfully' });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
