#!/usr/bin/env node
/**
 * Validates docs/github-org-bundle/repos-metadata.json + optional REPOS.md cross-check.
 * Used by CI, npm run verify:github-org, and github-org-automation (unless P31_SKIP_GITHUB_ORG_VERIFY=1).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.join(__dirname, "..");

const SCHEMA = "p31.githubOrgMetadata/1.0.0";
const MAX_DESC = 350;
const MAX_TOPICS = 20;
const TOPIC_RE = /^[a-z0-9-]+$/;
const NAME_RE = /^[a-zA-Z0-9._-]+$/;

/**
 * @param {unknown} data
 * @param {{ root?: string, reposMdPath?: string }} [opts]
 * @returns {{ errors: string[] }}
 */
export function validateGithubOrgMetadata(data, opts = {}) {
  const errors = [];
  const root = opts.root || defaultRoot;
  const reposMdPath = opts.reposMdPath || path.join(root, "docs", "github-org-bundle", "REPOS.md");

  if (!data || typeof data !== "object") {
    errors.push("root must be an object");
    return { errors };
  }
  if (data.schema !== SCHEMA) {
    errors.push(`schema must be "${SCHEMA}"`);
  }
  if (!data.organization || typeof data.organization !== "string" || !/^[a-z0-9-]+$/.test(data.organization)) {
    errors.push('organization must be a non-empty lowercase slug (e.g. "p31labs")');
  }
  if (!Array.isArray(data.repos)) {
    errors.push("repos must be an array");
    return { errors };
  }

  const seen = new Set();
  for (let i = 0; i < data.repos.length; i++) {
    const r = data.repos[i];
    const p = `repos[${i}]`;
    if (!r || typeof r !== "object") {
      errors.push(`${p} must be an object`);
      continue;
    }
    if (typeof r.name !== "string" || !NAME_RE.test(r.name)) {
      errors.push(`${p}.name must match ${NAME_RE} (GitHub repo name)`);
    } else if (seen.has(r.name)) {
      errors.push(`duplicate repos[].name: "${r.name}"`);
    } else {
      seen.add(r.name);
    }
    if (r.skip === true) {
      continue;
    }
    if (typeof r.description !== "string" || !r.description.trim()) {
      errors.push(`${p}.description required when skip is not true`);
    } else if (r.description.length > MAX_DESC) {
      errors.push(`${p}.description length ${r.description.length} exceeds ${MAX_DESC}`);
    }
    if (r.homepage !== undefined && r.homepage !== null && r.homepage !== "") {
      if (typeof r.homepage !== "string") {
        errors.push(`${p}.homepage must be a string`);
      } else if (!/^https?:\/\//i.test(r.homepage)) {
        errors.push(`${p}.homepage must start with http:// or https://`);
      } else if (r.homepage.length > 2048) {
        errors.push(`${p}.homepage too long`);
      }
    }
    if (r.topics !== undefined) {
      if (!Array.isArray(r.topics)) {
        errors.push(`${p}.topics must be an array`);
      } else {
        if (r.topics.length > MAX_TOPICS) {
          errors.push(`${p}.topics: at most ${MAX_TOPICS} (GitHub limit)`);
        }
        for (let j = 0; j < r.topics.length; j++) {
          const t = r.topics[j];
          if (typeof t !== "string" || !TOPIC_RE.test(t)) {
            errors.push(`${p}.topics[${j}] must be lowercase GitHub topic (regex ${TOPIC_RE})`);
          } else if (t.length > 50) {
            errors.push(`${p}.topics[${j}] exceeds 50 characters`);
          }
        }
      }
    }
  }

  if (process.env.P31_GITHUB_ORG_STRICT_REPOS_MD === "1" && fs.existsSync(reposMdPath)) {
    const md = fs.readFileSync(reposMdPath, "utf8");
    const org = data.organization || "p31labs";
    for (let i = 0; i < data.repos.length; i++) {
      const r = data.repos[i];
      if (!r || r.skip) continue;
      const needle = `${org}/${r.name}`;
      if (!md.includes(needle)) {
        errors.push(`repos[${i}] "${r.name}" not referenced in REPOS.md (expected substring "${needle}"; set P31_GITHUB_ORG_STRICT_REPOS_MD=0 to skip)`);
      }
    }
  }

  return { errors };
}

/**
 * @param {string} [root]
 */
export function assertFromDisk(root = defaultRoot) {
  const metaPath = path.join(root, "docs", "github-org-bundle", "repos-metadata.json");
  if (!fs.existsSync(metaPath)) {
    throw new Error("verify-github-org-metadata: missing " + metaPath);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (e) {
    throw new Error("verify-github-org-metadata: invalid JSON — " + (e && e.message ? e.message : e));
  }
  const { errors } = validateGithubOrgMetadata(data, { root });
  if (errors.length) {
    throw new Error("verify-github-org-metadata:\n" + errors.map((s) => "  - " + s).join("\n"));
  }
}

function main() {
  const root = defaultRoot;
  try {
    assertFromDisk(root);
    console.log("verify-github-org-metadata: OK");
  } catch (e) {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
}

const _here = path.resolve(fileURLToPath(import.meta.url));
const _entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (_entry === _here) main();
