#!/usr/bin/env node
/**
 * P31 fleet-ten MCP server.
 *
 * Reads scripts/p31-fleet-ten/models.json and exposes one tool per persona.
 * Each tool POSTs to the local Ollama /api/chat endpoint with the persona model id.
 *
 * Tool names: `p31_<suffix>` where <suffix> is the part after `p31-` in the persona id
 * (so `p31-mechanic` -> tool name `p31_mechanic`). MCP tool names must match
 * `^[a-zA-Z0-9_]+$`, and underscores keep them readable in Cursor.
 *
 * Inputs:
 *   { prompt: string, system?: string, temperature?: number, num_ctx?: number }
 *
 * Side-effect surface: outbound POST to OLLAMA_HOST (default http://127.0.0.1:11434).
 * No filesystem writes. Failures are returned as MCP tool errors, not exceptions.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const fleetRoot = path.join(repoRoot, "scripts", "p31-fleet-ten");
const modelsPath = path.join(fleetRoot, "models.json");

const OLLAMA_HOST = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = Number(process.env.P31_MCP_TIMEOUT_MS || 240000);

function loadModels() {
  if (!fs.existsSync(modelsPath)) {
    throw new Error(`models.json not found at ${modelsPath}`);
  }
  const data = JSON.parse(fs.readFileSync(modelsPath, "utf8"));
  if (!Array.isArray(data)) throw new Error("models.json must be an array");
  return data;
}

function toolNameFor(personaId) {
  // p31-mechanic -> p31_mechanic
  return personaId.replace(/-/g, "_");
}

function describeTool(m) {
  const role = m.roleFile ? m.roleFile.replace(/\.role\.txt$/, "") : m.id;
  return `Local P31 persona '${m.id}' (base ${m.from}). Routes through Ollama at ${OLLAMA_HOST}. Use for ${role} work; the system prompt is baked into the model so just supply the user prompt.`;
}

function buildInputSchema(m) {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: {
        type: "string",
        minLength: 1,
        description: "User prompt sent to the persona.",
      },
      system: {
        type: "string",
        description:
          "Optional extra system message appended after the persona's baked-in SYSTEM block. Use sparingly — the persona is already aligned.",
      },
      temperature: {
        type: "number",
        description: "Override sampling temperature for this call only.",
      },
      num_ctx: {
        type: "integer",
        description: "Override context window for this call only.",
      },
    },
  };
  if (m.id === "p31-triage") {
    schema.properties.format = {
      type: "string",
      enum: ["json"],
      description: "Force JSON-only output (recommended for triage).",
    };
  }
  return schema;
}

async function ollamaChat(model, args) {
  const messages = [];
  if (typeof args.system === "string" && args.system.length) {
    messages.push({ role: "system", content: args.system });
  }
  messages.push({ role: "user", content: args.prompt });

  const options = {};
  if (typeof args.temperature === "number") options.temperature = args.temperature;
  if (typeof args.num_ctx === "number") options.num_ctx = args.num_ctx;

  const body = {
    model,
    messages,
    stream: false,
  };
  if (args.format === "json") body.format = "json";
  if (Object.keys(options).length) body.options = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let resp;
  try {
    resp = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(
      `ollama-mcp: cannot reach Ollama at ${OLLAMA_HOST} (${err && err.message ? err.message : err}). ` +
        `Is 'ollama serve' running? Try: ollama serve`
    );
  }
  clearTimeout(timer);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`ollama-mcp: Ollama returned ${resp.status} ${resp.statusText}: ${text.slice(0, 400)}`);
  }
  const json = await resp.json();
  const content =
    (json && json.message && typeof json.message.content === "string" ? json.message.content : null) ||
    (typeof json.response === "string" ? json.response : null);
  if (typeof content !== "string") {
    throw new Error(`ollama-mcp: unexpected Ollama response shape: ${JSON.stringify(json).slice(0, 400)}`);
  }
  return {
    content,
    metrics: {
      total_duration_ms: typeof json.total_duration === "number" ? Math.round(json.total_duration / 1e6) : null,
      eval_count: json.eval_count ?? null,
      prompt_eval_count: json.prompt_eval_count ?? null,
    },
  };
}

async function main() {
  const models = loadModels();
  if (models.length === 0) {
    throw new Error("models.json has no personas");
  }

  const toolsByName = new Map();
  for (const m of models) {
    const name = toolNameFor(m.id);
    toolsByName.set(name, m);
  }

  const server = new Server(
    {
      name: "p31-ollama-fleet",
      version: "0.1.0",
    },
    {
      capabilities: { tools: {} },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: models.map((m) => ({
        name: toolNameFor(m.id),
        description: describeTool(m),
        inputSchema: buildInputSchema(m),
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    const m = toolsByName.get(name);
    if (!m) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool ${name}` }],
      };
    }
    try {
      const { content, metrics } = await ollamaChat(m.id, args);
      return {
        content: [
          { type: "text", text: content },
          {
            type: "text",
            text: `\n---\n[p31-ollama-mcp] persona=${m.id} eval=${metrics.eval_count ?? "?"} prompt=${metrics.prompt_eval_count ?? "?"} dur_ms=${metrics.total_duration_ms ?? "?"}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: err && err.message ? err.message : String(err) }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`p31-ollama-mcp ready (${models.length} personas, OLLAMA_HOST=${OLLAMA_HOST})\n`);
}

main().catch((err) => {
  process.stderr.write(`p31-ollama-mcp fatal: ${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
