import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Existing migrations
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS body TEXT`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'DICATAT'`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'LOW'`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'SYSTEM'`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS digest_id TEXT`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS topic_tag TEXT`;
    await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS agent TEXT DEFAULT 'SYSTEM'`;
    await sql`ALTER TABLE updates ADD COLUMN IF NOT EXISTS agent TEXT DEFAULT 'SYSTEM'`;
    await sql`ALTER TABLE actions ADD COLUMN IF NOT EXISTS decision TEXT DEFAULT 'PENDING'`;
    await sql`ALTER TABLE actions ADD COLUMN IF NOT EXISTS reason TEXT`;
    await sql`ALTER TABLE actions ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP`;
    await sql`ALTER TABLE actions ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP`;
    await sql`
      CREATE TABLE IF NOT EXISTS digest_history (
        id TEXT PRIMARY KEY,
        digest_id TEXT UNIQUE NOT NULL,
        raw_text TEXT NOT NULL,
        bullet_count INTEGER DEFAULT 0,
        parsed_at TIMESTAMP DEFAULT NOW(),
        source TEXT DEFAULT 'SYSTEM'
      )
    `;

    // New: projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'IN PROGRESS',
        completion INTEGER DEFAULT 0,
        assigned_agents TEXT,
        next_action TEXT,
        end_goal TEXT,
        success_criteria TEXT,
        deadline DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // New: project_actions table
    await sql`
      CREATE TABLE IF NOT EXISTS project_actions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        agent TEXT NOT NULL,
        action_type TEXT NOT NULL,
        title TEXT NOT NULL,
        detail TEXT,
        status TEXT DEFAULT 'DONE',
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

    // Seed projects
    await sql`
      INSERT INTO projects (id, name, status, completion, assigned_agents, next_action, end_goal, success_criteria, deadline)
      VALUES (
        'proj-oic', 'OIC Prototype', 'IN PROGRESS', 25,
        'ARIA,DAEDALUS,ICARUS,HEPHAESTUS',
        'Validate ESP-AI v2.0 on ESP32-S3 before chip decision',
        'Build working OIC hardware prototype by May 2026 — ESP32-S3/S31, GC9A01 circular display, always-on mic, Hermes agent as software brain',
        'Device boots, connects to Hermes, responds to voice, displays animated eyes on circular screen',
        '2026-05-31'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      INSERT INTO projects (id, name, status, completion, assigned_agents, next_action, end_goal, success_criteria, deadline)
      VALUES (
        'proj-erp', 'ERP Launch', 'BLOCKED', 40,
        'HEPHAESTUS,SCHOLAR',
        'Resolve Coretax API credential issue — Darren coordinating',
        'Launch ERP for Indonesian textile/garment SMEs — full Finance module, Coretax compliance, pilot users by June/July 2026',
        'At least 1 paying pilot user, Finance module fully functional, Coretax VAT integrated',
        '2026-06-30'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      INSERT INTO projects (id, name, status, completion, assigned_agents, next_action, end_goal, success_criteria, deadline)
      VALUES (
        'proj-gmba', 'GMBA Thesis', 'IN PROGRESS', 15,
        'SCHOLAR',
        'IB Individual Assignment due May 8 — start pipeline April 24',
        'Complete GMBA degree by Aug/Sep 2027 — all coursework, assignments, and thesis',
        'Graduate on time with all assignments submitted',
        '2027-08-31'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Seed project actions - OIC Prototype
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-oic-1', 'proj-oic', 'ARIA', 'RESEARCH', 'Initial architecture defined', 'Hermes agent selected as software brain. ESP32-S3 primary MCU. GC9A01 for circular eye display.', 'DONE', '2026-04-04')
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-oic-2', 'proj-oic', 'ICARUS', 'RESEARCH', 'ESP32-S31 verified', 'Espressif released ESP32-S31 on Apr 3 2026. Wi-Fi 6, Thread/Zigbee, SIMD edge AI, BT 5.4 LE. Evaluate vs S3 before finalizing.', 'DONE', '2026-04-04')
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-oic-3', 'proj-oic', 'DAEDALUS', 'RESEARCH', 'Competitor scan: Omi, Tab AI, Amazon orb', 'Omi = wearable pendant. Tab AI = necklace. Amazon orb = plastic ~$50-80. OIC desk positioning still unique. Material differentiation (brass/aluminum) is pitch tool.', 'DONE', '2026-04-04')
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-oic-4', 'proj-oic', 'DAEDALUS', 'RESEARCH', 'ESP-AI v2.0 test pending', 'Validate ESP-AI v2.0 on ESP32-S3 before chip decision. Not yet done.', 'IN PROGRESS', '2026-04-04')
      ON CONFLICT (id) DO NOTHING
    `;

    // Seed project actions - ERP Launch
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-erp-1', 'proj-erp', 'HEPHAESTUS', 'BUILD', 'Database schema ready', 'Prisma schema complete. All Finance tables defined including GL, COA, invoices, debit/credit notes, bank reconciliation.', 'DONE', '2026-04-03')
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-erp-2', 'proj-erp', 'SCHOLAR', 'BLOCKER', 'Awaiting API credentials', 'Coretax API integration blocked — need DJP sandbox credentials. Darren coordinating.', 'IN PROGRESS', '2026-04-04')
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-erp-3', 'proj-erp', 'ARIA', 'RESEARCH', 'Mekari fundraise + Airene launch', 'Mekari raised $100M, launched Airene AI assistant. Gap: Airene has no subcontracting or fabric yield understanding. ERP moat confirmed.', 'DONE', '2026-04-04')
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-erp-4', 'proj-erp', 'ICARUS', 'RESEARCH', 'Coretax VAT deadline April 30', 'SME owners stressed about Coretax right now. Interview window open. WhatsApp script ready.', 'DONE', '2026-04-04')
      ON CONFLICT (id) DO NOTHING
    `;

    // Seed project actions - GMBA Thesis
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-gmba-1', 'proj-gmba', 'SCHOLAR', 'MILESTONE', 'IB Individual Assignment', 'Due May 8. 3,000 kata. Option 6: Born Global recommended. Pipeline start April 24.', 'IN PROGRESS', '2026-04-04')
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO project_actions (id, project_id, agent, action_type, title, detail, status, created_at)
      VALUES ('pa-gmba-2', 'proj-gmba', 'SCHOLAR', 'MILESTONE', 'Strategy Matching submitted', 'Submitted April 3. Done.', 'DONE', '2026-04-03')
      ON CONFLICT (id) DO NOTHING
    `;

    return NextResponse.json({ ok: true, message: 'Migration complete' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
