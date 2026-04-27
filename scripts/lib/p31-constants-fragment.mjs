/**
 * Build canonicalNumbering for p31.ground-truth from p31-constants.json (shared by apply + verify).
 */
export function buildCanonicalNumbering(c) {
  return {
    spec: "P31 home: docs/CANONICAL-NUMBERING.md",
    passportLongForm: {
      edition: c.cognitivePassport.longFormEdition,
      sourceFile: c.cognitivePassport.longFormFilename,
      h1Authoritative: true,
    },
    jsonSchemaIds: {
      cognitivePassport: c.cognitivePassport.jsonSchema,
      groundTruth: c.groundTruth.schema,
    },
    bondingTestBaseline: {
      tests: c.bonding.testBaseline.tests,
      suites: c.bonding.testBaseline.suites,
      asOf: c.updated,
    },
  };
}

export function buildMissionSnippet(c) {
  return (
    "Build, create, connect — decentralized family mesh. This file is the machine-routable spine for p31ca.org; human narrative stays in root CLAUDE.md, " +
    c.cognitivePassport.longFormFilename +
    ", and docs/. Version namespaces: P31 home docs/CANONICAL-NUMBERING.md; values: P31 home p31-constants.json. " +
    "Source→sink alignment: P31 home p31-alignment.json (p31.alignment/1.0.0) and docs/P31-ALIGNMENT-SYSTEM.md (ephemeralization; verify: npm run verify:alignment)."
  );
}
