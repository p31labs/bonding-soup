#!/usr/bin/env node
/**
 * foundry-rag-indexer — Build searchable RAG index over Document Foundry corpus
 * 
 * Reads .p31-foundry/ artifacts and builds a MiniSearch index for fast
 * context retrieval. Used by grant-autodraft to pull relevant passages
 * from legal docs, previous grants, and research papers.
 * 
 * Usage:
 *   npm run foundry:rag:index        # Build index from foundry artifacts
 *   npm run foundry:rag:index -- --watch   # Watch for changes
 *   npm run foundry:rag:search "query"     # Search index
 *   npm run foundry:rag:context -- --grant nlnet --limit 5  # Get context for grant
 * 
 * Output: .p31-foundry/rag-index.json (MiniSearch compatible)
 * 
 * Related:
 *   - packages/p31-foundry/README.md
 *   - docs/P31-DOCUMENT-FOUNDRY.md
 *   - scripts/grant-autodraft.mjs (consumes this index)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const WATCH = args.includes("--watch");
const SEARCH_MODE = args[0] === "search" || args.includes("--search");
const CONTEXT_MODE = args.includes("--context");
const GRANT_TARGET = args.find(a => a.startsWith("--grant"))?.split("=")[1] || null;
const LIMIT = parseInt(args.find(a => a.startsWith("--limit"))?.split("=")[1] || "5");

const FOUNDRY_ROOT = process.env.P31_FOUNDRY_ROOT || path.join(ROOT, ".p31-foundry");
const INDEX_PATH = path.join(FOUNDRY_ROOT, "rag-index.json");

// Simple in-memory indexer (MiniSearch-like, no dependency)
class SimpleRAGIndex {
  constructor() {
    this.documents = new Map();
    this.terms = new Map();
    this.docCount = 0;
  }

  add(doc) {
    const { id, text, metadata = {} } = doc;
    if (!text) return;

    this.documents.set(id, { id, text, metadata });
    this.docCount++;

    // Tokenize and index
    const tokens = text.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const uniqueTokens = [...new Set(tokens)];

    for (const token of uniqueTokens) {
      if (!this.terms.has(token)) {
        this.terms.set(token, new Set());
      }
      this.terms.get(token).add(id);
    }
  }

  search(query, limit = 5) {
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scores = new Map();

    for (const token of tokens) {
      const docs = this.terms.get(token);
      if (docs) {
        for (const docId of docs) {
          scores.set(docId, (scores.get(docId) || 0) + 1);
        }
      }
    }

    const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    return sorted.map(([id, score]) => ({ ...this.documents.get(id), score }));
  }

  save(path) {
    const data = {
      documents: [...this.documents.entries()],
      terms: [...this.terms.entries()].map(([k, v]) => [k, [...v]]),
      docCount: this.docCount,
      builtAt: new Date().toISOString()
    };
    fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  }

  load(path) {
    if (!fs.existsSync(path)) return false;
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    this.documents = new Map(data.documents);
    this.terms = new Map(data.terms.map(([k, v]) => [k, new Set(v)]));
    this.docCount = data.docCount;
    return true;
  }
}

// Load foundry artifacts
function loadFoundryArtifacts() {
  const artifactsDir = path.join(FOUNDRY_ROOT, "artifacts");
  if (!fs.existsSync(artifactsDir)) {
    return [];
  }

  const artifacts = [];
  const hashes = fs.readdirSync(artifactsDir).filter(h => h.length === 64);

  for (const hash of hashes.slice(0, 100)) { // Limit to 100 for speed
    const recordPath = path.join(artifactsDir, hash, "record.json");
    if (fs.existsSync(recordPath)) {
      try {
        const record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
        artifacts.push({
          id: hash,
          filename: record.filename || "unknown",
          text: record.textExtracted || "",
          metadata: {
            mimeType: record.mimeType,
            pageCount: record.pageCount,
            ingestedAt: record.ingestedAt,
            tags: record.tags || []
          }
        });
      } catch {
        // Skip corrupted records
      }
    }
  }

  return artifacts;
}

// Load manual docs (grants, board docs, etc)
function loadManualDocs() {
  const docs = [];
  const paths = [
    "docs/grants",
    "docs/board",
    "docs/legal"
  ];

  for (const p of paths) {
    const fullPath = path.join(ROOT, p);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath).filter(f => f.endsWith(".md"));
      for (const file of files.slice(0, 20)) {
        const text = fs.readFileSync(path.join(fullPath, file), "utf8");
        docs.push({
          id: `${p}/${file}`,
          filename: file,
          text: text.slice(0, 10000), // Limit size
          metadata: { source: p, type: "markdown" }
        });
      }
    }
  }

  return docs;
}

// Grant-specific context queries
const GRANT_QUERIES = {
  "nlnet-ngi-zero-commons": ["open protocol", "K4 mesh", "synergetic", "commons", "federation"],
  "asan-disability-justice": ["autistic", "neurodivergent", "assistive technology", "accessibility", "cognitive"],
  "stimpunks-foundation": ["hardware", "IP protection", "patent", "provisional", "prototype"],
  "general": ["mission", "P31 Labs", "nonprofit", "grant", "funding"]
};

// Build index
function buildIndex() {
  console.log("Building RAG index from foundry artifacts...\n");

  const index = new SimpleRAGIndex();
  const artifacts = loadFoundryArtifacts();
  const manualDocs = loadManualDocs();

  console.log(`Found ${artifacts.length} ingested artifacts`);
  console.log(`Found ${manualDocs.length} manual documents\n`);

  for (const artifact of artifacts) {
    index.add(artifact);
  }

  for (const doc of manualDocs) {
    index.add(doc);
  }

  fs.mkdirSync(FOUNDRY_ROOT, { recursive: true });
  index.save(INDEX_PATH);

  console.log(`✅ Index built: ${index.docCount} documents`);
  console.log(`   Saved: ${INDEX_PATH}`);
  console.log(`\nCommands:`);
  console.log(`   npm run foundry:rag:search "your query"`);
  console.log(`   npm run foundry:rag:context -- --grant nlnet`);

  return index;
}

// Search index
function searchIndex(query) {
  const index = new SimpleRAGIndex();
  if (!index.load(INDEX_PATH)) {
    console.error("Index not found. Run: npm run foundry:rag:index");
    process.exit(1);
  }

  const results = index.search(query, LIMIT);

  console.log(`Search: "${query}"\n`);
  console.log(`Found ${results.length} results:\n`);

  for (const r of results) {
    console.log(`📄 ${r.filename || r.id} (score: ${r.score})`);
    const preview = r.text.slice(0, 200).replace(/\n/g, " ");
    console.log(`   ${preview}...\n`);
  }
}

// Get context for grant
function getGrantContext(grantId) {
  const index = new SimpleRAGIndex();
  if (!index.load(INDEX_PATH)) {
    console.error("Index not found. Run: npm run foundry:rag:index");
    process.exit(1);
  }

  const queries = GRANT_QUERIES[grantId] || GRANT_QUERIES.general;
  const allResults = [];

  for (const query of queries) {
    const results = index.search(query, 3);
    for (const r of results) {
      if (!allResults.find(existing => existing.id === r.id)) {
        allResults.push(r);
      }
    }
  }

  console.log(`Context for ${grantId}\n`);
  console.log(`Queries used: ${queries.join(", ")}\n`);
  console.log(`Retrieved ${allResults.length} unique passages:\n`);

  for (const r of allResults.slice(0, LIMIT)) {
    console.log(`--- ${r.filename || r.id} ---`);
    console.log(r.text.slice(0, 500));
    console.log("\n");
  }

  // Output JSON for piping to grant-autodraft
  const contextJson = {
    grant: grantId,
    sources: allResults.slice(0, LIMIT).map(r => ({
      id: r.id,
      filename: r.filename,
      excerpt: r.text.slice(0, 500),
      metadata: r.metadata
    }))
  };

  console.log("\n[JSON CONTEXT]");
  console.log(JSON.stringify(contextJson, null, 2));
}

// Main
if (SEARCH_MODE) {
  const query = args.find(a => !a.startsWith("--")) || args[args.indexOf("search") + 1];
  if (!query) {
    console.error("Usage: npm run foundry:rag:search -- \"your query\"");
    process.exit(1);
  }
  searchIndex(query);
} else if (CONTEXT_MODE) {
  if (!GRANT_TARGET) {
    console.error("Usage: npm run foundry:rag:context -- --grant nlnet");
    process.exit(1);
  }
  getGrantContext(GRANT_TARGET);
} else {
  // Build mode
  buildIndex();
  
  if (WATCH) {
    console.log("\n👀 Watching for changes (Ctrl+C to stop)...");
    // Simple watch - rebuild every 60 seconds
    setInterval(() => {
      console.log("\n[watch] Rebuilding index...");
      buildIndex();
    }, 60000);
  }
}
