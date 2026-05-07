/**
 * scripts/psych/scorer.mjs
 * Purpose: Quality scoring engine for P31 interfaces.
 */

import { fittsLaw, hicksLaw, swellerCognitiveLoad } from './science-core.mjs';

export const scoreInterface = (data) => {
  const { touchTargets, optionsCount, complexity } = data;
  
  const accessibilityScore = touchTargets.filter(t => t.size >= 44).length / touchTargets.length;
  const cognitiveLoadScore = 1 - (hicksLaw(optionsCount) / 10);
  
  return {
    a11y: accessibilityScore,
    cognitive: cognitiveLoadScore,
    overall: (accessibilityScore + cognitiveLoadScore) / 2
  };
};
