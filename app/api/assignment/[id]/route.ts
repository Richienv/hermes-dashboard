import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const assignmentResult = await sql`
      SELECT
        pa.id,
        pa.project_id,
        pa.agent,
        pa.action_type,
        pa.title,
        pa.detail,
        pa.status,
        pa.created_at,
        p.name AS project_name,
        p.deadline AS project_deadline
      FROM project_actions pa
      LEFT JOIN projects p ON p.id = pa.project_id
      WHERE pa.id = ${id}
      LIMIT 1
    `;

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const attachmentsResult = await sql`
      SELECT id, assignment_id, filename, mime_type, file_size, created_at
      FROM assignment_attachments
      WHERE assignment_id = ${id}
      ORDER BY created_at DESC
    `;

    const assignment = assignmentResult.rows[0];
    const attachments = attachmentsResult.rows.map((row) => ({
      ...row,
      public_url: `/api/attachment/${row.id}`,
    }));

    return NextResponse.json({ assignment, attachments }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('GET /api/assignment/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}