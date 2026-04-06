import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const projectResult = await sql`
      SELECT id, name, status, completion, assigned_agents, next_action,
             end_goal, success_criteria, deadline, created_at
      FROM projects
      WHERE id = ${id}
    `;

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const actionsResult = await sql`
      SELECT
        pa.id,
        pa.project_id,
        pa.agent,
        pa.action_type,
        pa.title,
        pa.detail,
        pa.status,
        pa.created_at,
        COALESCE(COUNT(aa.id), 0)::int AS attachments_count
      FROM project_actions pa
      LEFT JOIN assignment_attachments aa ON aa.assignment_id = pa.id
      WHERE pa.project_id = ${id}
      GROUP BY pa.id, pa.project_id, pa.agent, pa.action_type, pa.title, pa.detail, pa.status, pa.created_at
      ORDER BY pa.created_at DESC
    `;

    return NextResponse.json({
      project: projectResult.rows[0],
      actions: actionsResult.rows,
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('GET /api/project/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { progress, status, end_goal, success_criteria, deadline, next_action } = body;

    const sets: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (progress !== undefined) { sets.push(`completion = $${paramIndex++}`); values.push(progress); }
    if (status !== undefined) { sets.push(`status = $${paramIndex++}`); values.push(status); }
    if (end_goal !== undefined) { sets.push(`end_goal = $${paramIndex++}`); values.push(end_goal); }
    if (success_criteria !== undefined) { sets.push(`success_criteria = $${paramIndex++}`); values.push(success_criteria); }
    if (deadline !== undefined) { sets.push(`deadline = $${paramIndex++}`); values.push(deadline); }
    if (next_action !== undefined) { sets.push(`next_action = $${paramIndex++}`); values.push(next_action); }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE projects SET ${sets.join(', ')} WHERE id = $${paramIndex}`;

    // Use pg-style parameterized query via @vercel/postgres
    // @vercel/postgres uses tagged templates, so we build the query manually
    const { rows } = await sql.query(query, values);

    return NextResponse.json({ ok: true, rowsAffected: rows.length });
  } catch (error) {
    console.error('PATCH /api/project/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
