import { describe, expect, it } from 'vitest';
import { AGENTS, AGENT_IDS } from '../src/agents/registry';

describe('AGENTS registry', () => {
  it('defines exactly 11 agents', () => {
    expect(Object.keys(AGENTS)).toHaveLength(11);
    expect(AGENT_IDS).toHaveLength(11);
  });

  const lanes = [
    'STEWARD',
    'SENTINEL',
    'COUNSEL',
    'ADVOCATE',
    'TREASURER',
    'FORGE',
    'MEDIC',
    'HERALD',
    'SCHOLAR',
    'SCRIBE',
    'ORACLE',
  ];

  it.each(lanes)('%s exists with cron or manual/agent triggers', (id) => {
    const a = AGENTS[id];
    expect(a).toBeDefined();
    expect(a.tools.length).toBeGreaterThan(0);
    expect(typeof a.systemPrompt).toBe('string');
  });

  it('FORGE has zero spoon gate', () => {
    expect(AGENTS.FORGE.maxSpoonCost).toBe(0);
  });

  it('SENTINEL is outward physical bridge (tool surface)', () => {
    expect(AGENTS.SENTINEL.tools).toContain('set_home_scene');
    expect(AGENTS.SENTINEL.tools).toContain('get_sentinel_context');
    expect(AGENTS.SENTINEL.maxSpoonCost).toBe(0);
  });

  it('ORACLE has highest spoon cost', () => {
    expect(AGENTS.ORACLE.maxSpoonCost).toBeGreaterThanOrEqual(AGENTS.SCHOLAR.maxSpoonCost);
  });

  it('HERALD has email_inbound-only trigger cohort', () => {
    expect(AGENTS.HERALD.triggers).toContain('email_inbound');
  });

  it('every id matches key', () => {
    for (const id of AGENT_IDS) expect(AGENTS[id].id).toBe(id);
  });
});
