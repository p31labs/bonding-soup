/**
 * Pathspecs under andromeda/ git root mirrored from home doc-library sync.
 * Shared by verify-doc-library-p31ca-mirror.mjs and p31-mirror-fixer.mjs.
 */
export const HUB_MIRROR_GIT_PATHSPECS = [
  "04_SOFTWARE/p31ca/public/doc-library",
  "04_SOFTWARE/p31ca/public/p31-bonding.webmanifest",
  "04_SOFTWARE/p31ca/public/p31-bonding-icons",
  "04_SOFTWARE/p31ca/public/cognitive-passport",
];

/**
 * Files/dirs under p31ca `public/` written by sync:doc-library:p31ca.
 * Used by simulate-doc-library-hub-mirror.mjs (no writes to the real tree).
 */
export const DOC_LIBRARY_SYNC_PUBLIC_REL = [
  "doc-library",
  "p31-bonding.webmanifest",
  "p31-bonding-icons/p31-icon.svg",
  "cognitive-passport/p31-responsive-surface.css",
  "cognitive-passport/lib/p31-subject-prefs.js",
];
