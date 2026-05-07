/**
 * scripts/psych/persona-engine.mjs
 * Purpose: Simulates P31 personas for automated E2E testing.
 */

export const PERSONAS = {
  will: { id: 'will', role: 'Operator', wm: 7, focusTtl: 2700 },
  sj: { id: 'sj', role: 'Player', wm: 5, focusTtl: 1800 },
  wj: { id: 'wj', role: 'Player', wm: 3, focusTtl: 600 },
  brenda: { id: 'brenda', role: 'Ops', wm: 6 },
  public: { id: 'public', role: 'Visitor', wm: 7 },
};

export const getPersonaCapabilities = (personaId) => PERSONAS[personaId] || PERSONAS.public;
