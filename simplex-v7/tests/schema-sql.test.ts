import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));

describe('schema.sql OQE', () => {
  const sql = readFileSync(join(__dir, '../src/db/schema.sql'), 'utf8');

  it('documents 30 user tables in comment', () => {
    expect(sql).toMatch(/30 user-defined tables/);
  });

  it('contains expected core tables', () => {
    for (const name of [
      'accommodation_log',
      'knowledge_edges',
      'caught_thoughts',
      'debrief_log',
      'time_capsules',
      'calibrator_proposals',
      'remembered_vertices',
      'bereavement_periods',
      'agent_runs',
      'automation_rules',
      'biometric_log',
      'device_states',
      'home_events',
      'mqtt_log',
      'tomograph_events',
      'wcds',
      'deadlines',
      'benefits_log',
    ]) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${name}`);
    }
  });

  it('seeds SIMPLEX WCD rows', () => {
    expect(sql).toContain('WCD-SIMPLEX-01');
    expect(sql).toContain('WCD-SIMPLEX-06');
  });
});
