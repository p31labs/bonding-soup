/**
 * scripts/psych/science-core.mjs
 * Purpose: Core psychological metrics (Fitts, Hick, Shannon, Sweller, Bayes)
 */

export const fittsLaw = (distance, width) => Math.log2((distance / width) + 1);

export const hicksLaw = (n) => Math.log2(n + 1);

export const shannonEntropy = (probabilities) => 
  -probabilities.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);

export const swellerCognitiveLoad = (intrinsic, extraneous, germane) => 
  intrinsic + extraneous - germane;

export const bayesUpdate = (prior, likelihood, marginal) => (prior * likelihood) / marginal;
