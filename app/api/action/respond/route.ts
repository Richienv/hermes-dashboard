import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

function checkAuth(req: NextRequest) {
  return req.headers.get('X-Hermes-Key') === process.env.HERMES_API_KEY;
}

async function sendTelegram(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { actionId, decision, reason } = await req.json();

    if (!actionId || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'actionId and decision required' }, { status: 400 });
    }
    if (decision === 'REJECTED' && !reason?.trim()) {
      return NextResponse.json({ error: 'reason required for REJECTED' }, { status: 400 });
    }

    // Fetch action + thread info
    const result = await sql`
      SELECT a.id, a.description, a.status, t.topic, t.title AS thread_title
      FROM actions a
      JOIN threads t ON a.thread_id = t.id
      WHERE a.id = ${actionId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const action = result.rows[0];
    const status = decision === 'APPROVED' ? 'approved' : 'rejected';

    // Update action
    await sql`
      UPDATE actions
      SET
        status = ${status},
        decision = ${decision},
        reason = ${reason ?? null},
        decided_at = NOW(),
        resolved_at = NOW()
      WHERE id = ${actionId}
    `;

    // Build Telegram message
    const reasonLine = reason?.trim() ? `\nReason: ${reason.trim()}` : '';
    let message: string;

    if (decision === 'APPROVED') {
      message = `✅ <b>APPROVED</b>: ${action.description}${reasonLine}\n<i>Topic: ${action.topic}</i>\n→ Proceeding.`;
    } else {
      message = `❌ <b>REJECTED</b>: ${action.description}${reasonLine}\n<i>Topic: ${action.topic}</i>\n→ ARIA/GHOST/DAEDALUS noted. Will not proceed.`;
    }

    // Send Telegram
    await sendTelegram(message);

    // Mark notified
    await sql`UPDATE actions SET notified_at = NOW() WHERE id = ${actionId}`;

    return NextResponse.json({ ok: true, decision, message });
  } catch (error) {
    console.error('POST /api/action/respond error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
