/**
 * scripts/psych/build-gate.mjs
 * Purpose: Enforces psychological metrics as mandatory build gates.
 * Fails the build if cognitive load (Hick's Law) or accessibility (Fitts' Law) targets are not met.
 */

import { fittsLaw, hicksLaw, swellerCognitiveLoad } from './science-core.mjs';

const TARGETS = {
  maxHickIndex: 3.5, // ~10 items max before performance drops
  minFittsIndex: 0.8, // touch target size relative to distance
  maxCognitiveLoad: 5.0 // intrinsic + extraneous - germane
};

export const verifyPsychIntegrity = (data) => {
  const { optionsCount, touchTargets, complexity } = data;
  
  const hIndex = hicksLaw(optionsCount);
  const fIndex = touchTargets.length > 0 ? 
    touchTargets.reduce((acc, t) => acc + fittsLaw(t.distance, t.size), 0) / touchTargets.length : 1;
  const cLoad = swellerCognitiveLoad(complexity.intrinsic, complexity.extraneous, complexity.germane);

  console.log(`--- Psych Build Gate Verification ---`);
  console.log(`Hick's Index: ${hIndex.toFixed(2)} (Target: <${TARGETS.maxHickIndex})`);
  console.log(`Fitts' Index: ${fIndex.toFixed(2)} (Target: >${TARGETS.minFittsIndex})`);
  console.log(`Cognitive Load: ${cLoad.toFixed(2)} (Target: <${TARGETS.maxCognitiveLoad})`);

  if (hIndex > TARGETS.maxHickIndex || fIndex < TARGETS.minFittsIndex || cLoad > TARGETS.maxCognitiveLoad) {
    console.error('❌ Psych Build Gate Failed: Interface complexity exceeds cognitive limits.');
    return false;
  }

  console.log('✅ Psych Build Gate Passed.');
  return true;
};
