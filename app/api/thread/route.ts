import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

function checkAuth(req: NextRequest): boolean {
  return req.headers.get('X-Hermes-Key') === process.env.HERMES_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const {
      topic,
      title,
      body,
      section = 'DICATAT',
      urgency = 'LOW',
      source = 'SYSTEM',
      actionRequired = false,
      action = null,
      digestId,
      topicTag,
      agent, // New optional field
    } = await req.json();

    if (!topic || !title) {
      return NextResponse.json({ error: 'topic and title required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const effectiveTopicTag = topicTag || topic;
    const effectiveAgent = agent || source || 'SYSTEM';

    await sql`
      INSERT INTO threads (id, topic, title, body, section, urgency, source, action_required, digest_id, topic_tag, agent)
      VALUES (
        ${id}, ${topic}, ${title}, ${body ?? null},
        ${section}, ${urgency}, ${source},
        ${actionRequired}, ${digestId ?? null}, ${effectiveTopicTag}, ${effectiveAgent}
      )
    `;

    // If actionRequired=true and action text provided, auto-create a pending action
    if (actionRequired && action) {
      const actionId = crypto.randomUUID();
      await sql`
        INSERT INTO actions (id, thread_id, description, status)
        VALUES (${actionId}, ${id}, ${action}, 'pending')
      `;
    }

    return NextResponse.json({ id }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('POST /api/thread error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
