/**
 * Accommodation log — auto-ingest from existing D1 telemetry (SIMPLEX v7).
 * @see docs/P31-ACCOMMODATION-LOG-SYSTEM.md
 */
import type { Env } from '../agents/types';

export function utcDayRangeMs(isoUtc: string): { start: number; end: number } {
  const d = new Date(isoUtc);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return { start: Date.UTC(y, m, day), end: Date.UTC(y, m, day + 1) };
}

function isoDateParts(ms: number): { entry_date: string; entry_time: string } {
  const d = new Date(ms);
  const entry_date = d.toISOString().slice(0, 10);
  const entry_time = d.toISOString().slice(11, 19);
  return { entry_date, entry_time };
}

type AgentRunRow = {
  run_id: string;
  agent_id: string;
  trigger: string;
  voltage: string;
  summary: string | null;
  duration_ms: number | null;
  created_at: number;
};

export function mapAgentRunToAccommodation(row: AgentRunRow): {
  task: string;
  tool: string;
  accommodation: string;
  duration_min: number | null;
  limitation: string;
  alternative: string;
  outcome: string;
  limitation_kind: string;
} {
  const task = (row.summary && row.summary.trim()) || `${row.agent_id} agent run (${row.trigger})`;
  const tool = `SIMPLEX v7 — ${row.agent_id}`;
  const accommodation =
    'Automated agent crew execution — planning, retrieval, and structured output without manual executive sequencing.';
  const duration_min =
    typeof row.duration_ms === 'number' && row.duration_ms > 0 ? row.duration_ms / 60_000 : null;
  const limitation =
    'Executive dysfunction / serialization bottleneck — sustained multi-step operations require external scaffolding.';
  const alternative =
    'Without AI-assisted crew: missed cross-domain checks, delayed filings, inconsistent self-tracking under variable spoon load.';
  const outcome = `Voltage ${row.voltage}; run persisted to D1 agent_runs.`;
  return {
    task,
    tool,
    accommodation,
    duration_min,
    limitation,
    alternative,
    outcome,
    limitation_kind: 'executive',
  };
}

type TomographRow = {
  id: number;
  sender: string | null;
  subject: string | null;
  voltage: string;
  action: string | null;
  created_at: number;
};

export function mapTomographToAccommodation(row: TomographRow): {
  task: string;
  tool: string;
  accommodation: string;
  duration_min: null;
  limitation: string;
  alternative: string;
  outcome: string;
  limitation_kind: string;
} {
  const task = `Email / comms triage — ${row.subject ?? 'message'} (${row.sender ?? 'unknown'})`;
  const tool = 'SIMPLEX v7 — HERALD (tomograph_events)';
  const accommodation =
    'Automated emotional-load triage buffers high-voltage traffic before it reaches the operator.';
  const limitation = 'AuDHD fawn tendency and context-switch cost on hostile or high-voltage inbound.';
  const alternative =
    'Without triage: immediate engagement risk, spoon loss, and abandoned primary task.';
  const outcome = `Action: ${row.action ?? 'logged'} · voltage ${row.voltage}`;
  return {
    task,
    tool,
    accommodation,
    duration_min: null,
    limitation,
    alternative,
    outcome,
    limitation_kind: 'sensory',
  };
}

type MedicationRow = {
  id: number;
  name: string;
  logged_at: number;
};

export function mapMedicationToAccommodation(row: MedicationRow): {
  task: string;
  tool: string;
  accommodation: string;
  duration_min: null;
  limitation: string;
  alternative: string;
  outcome: string;
  limitation_kind: string;
} {
  const task = `Medication log — ${row.name}`;
  const tool = 'SIMPLEX v7 — MEDIC (medications table)';
  const accommodation =
    'Structured medication timing log with interval and criticality metadata — reduces reliance on interoceptive recall.';
  const limitation =
    'Hypoparathyroidism / executive timing — consistent dosing windows require external cueing and audit trail.';
  const alternative =
    'Without logged prosthetic support: missed doses, calcium window violations, acute risk.';
  const outcome = `Logged at ${new Date(row.logged_at).toISOString()}`;
  return {
    task,
    tool,
    accommodation,
    duration_min: null,
    limitation,
    alternative,
    outcome,
    limitation_kind: 'medical',
  };
}

/** Ingests telemetry for [start, end) into accommodation_log (idempotent via source_ref). */
export async function syncAccommodationInterval(
  env: Env,
  start: number,
  end: number,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  const runs = await env.DB.prepare(
    'SELECT run_id, agent_id, trigger, voltage, summary, duration_ms, created_at FROM agent_runs WHERE created_at >= ? AND created_at < ? ORDER BY created_at ASC',
  )
    .bind(start, end)
    .all<AgentRunRow>();
  for (const row of runs.results ?? []) {
    const ref = `agent_run:${row.run_id}`;
    const dup = await env.DB.prepare('SELECT 1 AS x FROM accommodation_log WHERE source_ref = ?').bind(ref).first();
    if (dup) {
      skipped++;
      continue;
    }
    const m = mapAgentRunToAccommodation(row);
    const { entry_date, entry_time } = isoDateParts(row.created_at);
    await env.DB.prepare(
      `INSERT INTO accommodation_log (
        entry_date, entry_time, task, tool, accommodation, duration_min, limitation, alternative, outcome,
        source, is_auto, limitation_kind, source_ref, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        entry_date,
        entry_time,
        m.task,
        m.tool,
        m.accommodation,
        m.duration_min,
        m.limitation,
        m.alternative,
        m.outcome,
        'SCRIBE_sync',
        1,
        m.limitation_kind,
        ref,
        row.created_at,
      )
      .run();
    inserted++;
  }

  const tomos = await env.DB.prepare(
    'SELECT id, sender, subject, voltage, action, created_at FROM tomograph_events WHERE created_at >= ? AND created_at < ? ORDER BY created_at ASC',
  )
    .bind(start, end)
    .all<TomographRow>();
  for (const row of tomos.results ?? []) {
    const ref = `tomograph:${row.id}`;
    const dup = await env.DB.prepare('SELECT 1 AS x FROM accommodation_log WHERE source_ref = ?').bind(ref).first();
    if (dup) {
      skipped++;
      continue;
    }
    const m = mapTomographToAccommodation(row);
    const { entry_date, entry_time } = isoDateParts(row.created_at);
    await env.DB.prepare(
      `INSERT INTO accommodation_log (
        entry_date, entry_time, task, tool, accommodation, duration_min, limitation, alternative, outcome,
        source, is_auto, limitation_kind, source_ref, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        entry_date,
        entry_time,
        m.task,
        m.tool,
        m.accommodation,
        m.duration_min,
        m.limitation,
        m.alternative,
        m.outcome,
        'SCRIBE_sync',
        1,
        m.limitation_kind,
        ref,
        row.created_at,
      )
      .run();
    inserted++;
  }

  const meds = await env.DB.prepare(
    'SELECT id, name, logged_at FROM medications WHERE logged_at >= ? AND logged_at < ? ORDER BY logged_at ASC',
  )
    .bind(start, end)
    .all<MedicationRow>();
  for (const row of meds.results ?? []) {
    const ref = `medication:${row.id}`;
    const dup = await env.DB.prepare('SELECT 1 AS x FROM accommodation_log WHERE source_ref = ?').bind(ref).first();
    if (dup) {
      skipped++;
      continue;
    }
    const m = mapMedicationToAccommodation(row);
    const { entry_date, entry_time } = isoDateParts(row.logged_at);
    await env.DB.prepare(
      `INSERT INTO accommodation_log (
        entry_date, entry_time, task, tool, accommodation, duration_min, limitation, alternative, outcome,
        source, is_auto, limitation_kind, source_ref, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        entry_date,
        entry_time,
        m.task,
        m.tool,
        m.accommodation,
        m.duration_min,
        m.limitation,
        m.alternative,
        m.outcome,
        'SCRIBE_sync',
        1,
        m.limitation_kind,
        ref,
        row.logged_at,
      )
      .run();
    inserted++;
  }

  const spoonAgg = await env.DB.prepare(
    'SELECT COUNT(*) AS n, SUM(cost) AS total_cost, MIN(balance_after) AS min_bal FROM spoons WHERE ts >= ? AND ts < ?',
  )
    .bind(start, end)
    .first<{ n: number; total_cost: number | null; min_bal: number | null }>();
  const n = Number(spoonAgg?.n ?? 0);
  if (n > 0) {
    const dayKey = new Date(start).toISOString().slice(0, 10);
    const ref = `spoons_day:${dayKey}`;
    const dup = await env.DB.prepare('SELECT 1 AS x FROM accommodation_log WHERE source_ref = ?').bind(ref).first();
    if (!dup) {
      const total = Number(spoonAgg?.total_cost ?? 0);
      const minBal = spoonAgg?.min_bal ?? null;
      const task = `Spoon economy — ${n} debit(s), Σ cost ${total.toFixed(2)}`;
      const tool = 'SIMPLEX v7 — spoons ledger';
      const accommodation =
        'Objective spoon accounting replaces unreliable subjective capacity estimates under interoception variance.';
      const limitation = 'Interoception / executive — inaccurate self-model of remaining capacity without telemetry.';
      const alternative =
        'Without ledger: overallocation to high-cost tasks, meltdown risk, unpaid work debt.';
      const outcome =
        minBal != null ? `Minimum balance observed: ${minBal}` : 'Balances recorded in spoons table.';
      const { entry_date, entry_time } = isoDateParts(end - 1);
      await env.DB.prepare(
        `INSERT INTO accommodation_log (
          entry_date, entry_time, task, tool, accommodation, duration_min, limitation, alternative, outcome,
          source, is_auto, limitation_kind, source_ref, created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
        .bind(
          entry_date,
          entry_time,
          task,
          tool,
          accommodation,
          null,
          limitation,
          alternative,
          outcome,
          'SCRIBE_sync',
          1,
          'sensory',
          ref,
          end - 1,
        )
        .run();
      inserted++;
    } else {
      skipped++;
    }
  }

  const bioAgg = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM biometric_log WHERE ts >= ? AND ts < ?',
  )
    .bind(start, end)
    .first<{ n: number }>();
  const bn = Number(bioAgg?.n ?? 0);
  if (bn > 0) {
    const dayKey = new Date(start).toISOString().slice(0, 10);
    const ref = `biometric_day:${dayKey}`;
    const dup = await env.DB.prepare('SELECT 1 AS x FROM accommodation_log WHERE source_ref = ?').bind(ref).first();
    if (!dup) {
      const task = `Biometric ingest — ${bn} reading(s) in 24h window`;
      const tool = 'SIMPLEX v7 — SENTINEL / biometric_log';
      const accommodation =
        'Machine-recorded vitals and activity proxies reduce reliance on subjective symptom recall.';
      const limitation =
        'Interoception deficit — operator cannot reliably self-report physiological state for dosing and pacing.';
      const alternative =
        'Without telemetry: blind pacing, missed hypocalcemia cues, inconsistent medication alignment.';
      const outcome = `${bn} rows retained in D1 biometric_log for audit trail.`;
      const { entry_date, entry_time } = isoDateParts(end - 1);
      await env.DB.prepare(
        `INSERT INTO accommodation_log (
          entry_date, entry_time, task, tool, accommodation, duration_min, limitation, alternative, outcome,
          source, is_auto, limitation_kind, source_ref, created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
        .bind(
          entry_date,
          entry_time,
          task,
          tool,
          accommodation,
          null,
          limitation,
          alternative,
          outcome,
          'SCRIBE_sync',
          1,
          'medical',
          ref,
          end - 1,
        )
        .run();
      inserted++;
    } else {
      skipped++;
    }
  }

  return { inserted, skipped };
}
