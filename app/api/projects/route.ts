import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, status, completion, assigned_agents, next_action, 
             end_goal, success_criteria, deadline, created_at
      FROM projects
      ORDER BY created_at DESC
    `;

    return NextResponse.json(result.rows, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
