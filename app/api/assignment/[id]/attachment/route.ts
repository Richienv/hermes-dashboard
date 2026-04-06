import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { rows } = await sql`
      SELECT id, assignment_id, filename, mime_type, file_size, created_at
      FROM assignment_attachments
      WHERE assignment_id = ${id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      attachments: rows.map((row) => ({
        ...row,
        public_url: `/api/attachment/${row.id}`,
      })),
    });
  } catch (error) {
    console.error('GET /api/assignment/[id]/attachment error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file field required' }, { status: 400 });
    }

    const assignmentCheck = await sql`
      SELECT id FROM project_actions WHERE id = ${id} LIMIT 1
    `;

    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const attachmentId = crypto.randomUUID();

    await sql.query(
      'INSERT INTO assignment_attachments (id, assignment_id, filename, mime_type, file_size, file_data) VALUES ($1, $2, $3, $4, $5, $6)',
      [attachmentId, id, file.name, file.type || 'application/octet-stream', bytes.length, bytes],
    );

    return NextResponse.json({
      id: attachmentId,
      assignment_id: id,
      filename: file.name,
      mime_type: file.type || 'application/octet-stream',
      file_size: bytes.length,
      public_url: `/api/attachment/${attachmentId}`,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/assignment/[id]/attachment error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}