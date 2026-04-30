# P31 Ollama MCP bridge

Local Model Context Protocol server that exposes each [scripts/p31-fleet-ten/](../p31-fleet-ten/) persona as a Cursor tool. Lets the Anthropic-backed Cursor agent (or any MCP client) summon a P31 local persona — `p31_mechanic`, `p31_counsel`, `p31_triage`, etc. — without leaving the editor and without round-tripping prompts through the cloud.

## Install (one-time)

```bash
cd scripts/ollama-mcp
npm install
```

## Wire into Cursor

Append this block to `~/.cursor/mcp.json` (create the file if missing):

```json
{
  "mcpServers": {
    "p31-ollama-fleet": {
      "command": "node",
      "args": ["/home/p31/scripts/ollama-mcp/server.mjs"],
      "env": { "OLLAMA_HOST": "http://127.0.0.1:11434" }
    }
  }
}
```

Restart Cursor. Tools `p31_mechanic`, `p31_firmware`, `p31_counsel`, `p31_narrator`, `p31_triage`, `p31_quick`, `p31_phos`, `p31_scribe`, `p31_oracle`, `p31_debrief` will appear in the agent tool list.

## Operator desk + CONNECTION spine (browser, not MCP)

The local command center (`npm run command-center`, default **:3131**) serves a read-first **operator desk** at **`/desk`** — same JSON as `GET /api/connection-summary`, `/api/health`, `/api/glass-snapshot`, SIMPLEX proxies. Use it for a calm status pane; keep **whitelisted runs** on **`/`** (automation gate). From a terminal: **`p31 open desk`** or **`npm run command-center:open-desk`**. This is separate from the Ollama MCP tools above (desk does not call Ollama).

## Tool contract

Each tool accepts:

```jsonc
{
  "prompt": "string (required)",
  "system": "string (optional, appended after the persona's baked-in SYSTEM block)",
  "temperature": 0.0,
  "num_ctx": 4096
}
```

`p31_triage` additionally accepts `format: "json"` to force JSON-only output (recommended; matches the 4-tier voltage contract in [p31-triage.role.txt](../p31-fleet-ten/prompts/p31-triage.role.txt)).

The tool result is the assistant's content as plain text plus a single `[p31-ollama-mcp]` metrics line (`eval`, `prompt`, `dur_ms`).

## Verify

```bash
npm run verify        # in scripts/ollama-mcp
# or from repo root:
npm run verify:ollama-mcp
```

Static checks always run; the dynamic JSON-RPC handshake runs only if `node_modules/` is present. The dynamic check uses an unreachable `OLLAMA_HOST` so `tools/list` does **not** require a running `ollama serve` to pass.

## Operator-confidential routing

Hard guidance (mirrored in [.cursor/rules/p31-ollama-fleet.mdc](../../.cursor/rules/p31-ollama-fleet.mdc)):

- `p31_counsel` / `p31_triage` / `p31_phos` MUST be invoked through the MCP bridge (this server) or the Continue.dev sidebar — never through the Cloudflare Tunnel model picker, because that path round-trips the prompt through Cursor's cloud verification servers.
- The MCP bridge runs entirely on `127.0.0.1`; Cursor's agent receives only the tool *result* the bridge returns, but the *prompt-to-tool* leg still passes through Cursor when the agent decides to call the tool. For maximally-private work (operator-only legal drafts, hostile mail triage), prefer the Continue.dev sidebar.
