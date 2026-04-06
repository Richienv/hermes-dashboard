import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const { attachmentId } = await params;

  try {
    const { rows } = await sql`
      SELECT id, filename, mime_type, file_data, file_size, created_at
      FROM assignment_attachments
      WHERE id = ${attachmentId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return new NextResponse('Not found', { status: 404 });
    }

    const file = rows[0];
    const buffer = Buffer.isBuffer(file.file_data)
      ? file.file_data
      : Buffer.from(file.file_data);
    const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    return new NextResponse(body, {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Length': String(file.file_size),
        'Content-Disposition': `inline; filename="${file.filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('GET /api/attachment/[attachmentId] error:', error);
    return new NextResponse(String(error), { status: 500 });
  }
}