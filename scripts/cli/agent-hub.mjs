#!/usr/bin/env node
/**
 * `p31 agent-hub` — operator-side CLI for the K₄ agent worker tetrahedron.
 *
 *   p31 agent-hub keypair                    # show / generate the operator's keypair (~/.p31/agent-hub-key.json)
 *   p31 agent-hub topology   [--base URL]    # GET /v1/topology
 *   p31 agent-hub federation [--base URL]    # GET /v1/federation
 *   p31 agent-hub manifest   [--base URL]    # GET /v1/manifest
 *   p31 agent-hub dock       [--base URL]    # signed dock; print sessionId + allowedSkills
 *   p31 agent-hub call <hub> <skill> [--prompt "..."] [--base URL]  # signed dock + signed call
 *   p31 agent-hub cross <from> <to> [--ask "..."] [--base URL]      # GET /v1/cross/{from}/{to}
 *
 * Default base URL: P31_K4_AGENT_HUB_BASE env var, else http://127.0.0.1:8787.
 * Keypair: ~/.p31/agent-hub-key.json (created on first dock/call).
 */
import process from "node:process";
import { K4AgentHubClient, ensureKeyPair } from "../../packages/k4-agent-hub-client/src/index.mjs";
import { ensureAnchorPact, loadAnchorPact, pactFingerprint, verifyAnchorPact } from "../../packages/k4-agent-hub-client/src/anchor-pact.mjs";

const argv = process.argv.slice(2);
const sub = argv[0];
const rest = argv.slice(1);

function arg(flag) {
  const i = rest.indexOf(flag);
  return i >= 0 && i + 1 < rest.length ? rest[i + 1] : null;
}

const baseUrl = arg("--base") ?? process.env.P31_K4_AGENT_HUB_BASE ?? "http://127.0.0.1:8787";

function help() {
  console.log(`p31 agent-hub — K₄ agent worker tetrahedron client

Usage:
  p31 agent-hub keypair
  p31 agent-hub anchor create                    # create + sign ~/.p31/anchor-pact.json
  p31 agent-hub anchor show                      # display local anchor pact (public fields)
  p31 agent-hub anchor verify                    # verify local pact signature offline
  p31 agent-hub anchor register [--base URL]     # POST /v1/anchor/register
  p31 agent-hub anchor status   [--base URL]     # GET  /v1/anchor/status
  p31 agent-hub manifest   [--base URL]
  p31 agent-hub topology   [--base URL]
  p31 agent-hub federation [--base URL]
  p31 agent-hub dock       [--base URL]
  p31 agent-hub call <hub> <skill> [--prompt "..."] [--base URL]
  p31 agent-hub cross <from> <to> [--ask "..."] [--base URL]

Default base: ${baseUrl}
Keypair file:     ~/.p31/agent-hub-key.json (generated on first call)
Anchor pact file: ~/.p31/anchor-pact.json  (created by anchor create)
`);
}

async function main() {
  if (!sub || sub === "-h" || sub === "--help") { help(); return 0; }

  if (sub === "keypair") {
    const k = await ensureKeyPair();
    console.log(JSON.stringify({
      clientId: k.clientId,
      publicKeyB64u: k.publicKeyB64u,
      createdAt: new Date(k.createdAt).toISOString(),
    }, null, 2));
    return 0;
  }

  if (sub === "anchor") {
    const anchorSub = rest[0];
    const key = await ensureKeyPair();

    if (!anchorSub || anchorSub === "create") {
      const { pact, created } = await ensureAnchorPact(key);
      if (created) {
        console.log("anchor-pact created →", "~/.p31/anchor-pact.json");
      } else {
        console.log("anchor-pact already exists (clientId matches keypair)");
      }
      console.log(JSON.stringify(pactFingerprint(pact), null, 2));
      return 0;
    }

    if (anchorSub === "show") {
      const pact = await loadAnchorPact();
      if (!pact) { console.error("no anchor pact found — run: p31 agent-hub anchor create"); return 1; }
      console.log(JSON.stringify(pactFingerprint(pact), null, 2));
      return 0;
    }

    if (anchorSub === "verify") {
      const pact = await loadAnchorPact();
      if (!pact) { console.error("no anchor pact found — run: p31 agent-hub anchor create"); return 1; }
      const valid = await verifyAnchorPact(pact);
      if (valid) {
        console.log("anchor-pact signature: VALID ✓");
        console.log(" clientId:", pact.clientId);
        console.log(" publicKeyB64u:", pact.publicKeyB64u);
        return 0;
      } else {
        console.error("anchor-pact signature: INVALID ✗");
        return 1;
      }
    }

    if (anchorSub === "register") {
      const pact = await loadAnchorPact();
      if (!pact) { console.error("no anchor pact found — run: p31 agent-hub anchor create"); return 1; }
      const c = new K4AgentHubClient({ baseUrl, keyPair: key });
      const r = await c.anchorRegister(pact);
      console.log(JSON.stringify(r, null, 2));
      return r.ok ? 0 : 1;
    }

    if (anchorSub === "status") {
      const c = new K4AgentHubClient({ baseUrl, keyPair: key });
      const r = await c.anchorStatus();
      console.log(JSON.stringify(r, null, 2));
      return r.ok ? 0 : 1;
    }

    console.error(`unknown anchor subcommand: ${anchorSub}`);
    help();
    return 2;
  }

  // Routes that don't need a keypair
  if (sub === "manifest" || sub === "topology" || sub === "federation" || sub === "cross") {
    if (sub === "cross") {
      const from = rest[0];
      const to = rest[1];
      if (!from || !to) { console.error("p31 agent-hub cross <from> <to> [--ask \"...\"]"); return 2; }
      const ask = arg("--ask");
      const url = new URL(`${baseUrl}/v1/cross/${from}/${to}`);
      if (ask) url.searchParams.set("ask", ask);
      const r = await fetch(url);
      console.log(JSON.stringify(await r.json(), null, 2));
      return r.ok ? 0 : 1;
    }
    const r = await fetch(`${baseUrl}/v1/${sub}`);
    console.log(JSON.stringify(await r.json(), null, 2));
    return r.ok ? 0 : 1;
  }

  // Routes that need a keypair (dock-bearing)
  const key = await ensureKeyPair();
  const c = new K4AgentHubClient({ baseUrl, keyPair: key, capabilities: [
    "ts-worker", "esp-firmware", "one-liner",
    "pro-se-georgia", "voltage-triage", "post-incident",
    "grants-synthesis", "q-factor-patterns",
    "passport-mirror",
  ] });

  if (sub === "dock") {
    const session = await c.dock();
    console.log(JSON.stringify({
      sessionId: session.sessionId,
      signed: session.signed,
      allowedSkills: session.allowedSkills,
      hubs: session.hubs,
    }, null, 2));
    return 0;
  }

  if (sub === "call") {
    const hub = rest[0];
    const skill = rest[1];
    if (!hub || !skill) { console.error("p31 agent-hub call <hub> <skill> [--prompt \"...\"]"); return 2; }
    const prompt = arg("--prompt") ?? "";
    const r = await c.call(hub, skill, prompt ? { prompt } : {});
    console.log(JSON.stringify(r, null, 2));
    return r.ok === false ? 1 : 0;
  }

  console.error(`unknown subcommand: ${sub}`);
  help();
  return 2;
}

main().then((code) => process.exit(code ?? 0)).catch((e) => {
  console.error("p31 agent-hub error:", e?.message ?? e);
  process.exit(2);
});
