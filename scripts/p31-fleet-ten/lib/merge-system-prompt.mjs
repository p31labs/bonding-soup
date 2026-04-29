#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fleetRoot = path.join(__dirname, "..");

export function buildSystemPrompt(roleFile) {
  const parts = [
    "_shared-operator-root.txt",
    "_shared-fleet-root.txt",
    roleFile,
  ].map((f) => fs.readFileSync(path.join(fleetRoot, "prompts", f), "utf8"));
  return parts.join("\n\n---\n\n");
}
