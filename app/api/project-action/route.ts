import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, agent, action_type, title, detail, status } = body;

    if (!project_id || !agent || !action_type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, agent, action_type, title' },
        { status: 400 }
      );
    }

    const id = `pa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status)
      VALUES (${id}, ${project_id}, ${agent}, ${action_type}, ${title}, ${detail || null}, ${status || 'DONE'})
    `;

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/project-action error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
