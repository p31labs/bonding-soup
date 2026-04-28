/**
 * Strict 24-bit ANSI boot banner + INIT/MESH/READY (single telemetry path).
 */
import process from "node:process";
import { P31_HASH_WORDMARK, TETRA_WIRE } from "./ascii-boot.mjs";
import { useFullBoot } from "./tty.mjs";
import { dim, green } from "./theme.mjs";

const c = {
  cyan: (t) => `\x1b[38;2;77;184;168m${t}\x1b[0m`,
  magenta: (t) => `\x1b[35m${t}\x1b[0m`,
  muted: (t) => `\x1b[38;2;90;107;124m${t}\x1b[0m`,
  phos: (t) => `\x1b[38;2;59;163;114m${t}\x1b[0m`,
  gold: (t) => `\x1b[38;2;205;168;82m${t}\x1b[0m`,
};

/** @param {{ write: (s: string) => void }} out */
export function writeBootPayload(out = process.stdout) {
  if (!useFullBoot()) {
    out.write(dim("P31 CLI · ") + green("ready") + "\n");
    return;
  }

  out.write("\x1b[2J\x1b[H");

  out.write(`${c.magenta("════════════════════════════════════════════════════════════")}\n`);

  out.write(
    "\n" +
      `      ${c.gold("⬡")}` +
      "\n" +
      TETRA_WIRE +
      "\n",
  );

  out.write(`${c.magenta("────────────────────────────────────────────────────────────")}\n`);

  const word = "\n" + c.cyan(P31_HASH_WORDMARK + "\n");

  out.write(word);
  out.write(`${c.magenta("════════════════════════════════════════════════════════════\n")}\n`);
  out.write(`${c.muted("local mesh · build · connect")}\n\n`);
  out.write(`${c.cyan("INIT")}   ${c.muted("·")} calibrating local mesh context\n`);
  out.write(`${c.cyan("MESH")}   ${c.muted("·")} K₄ topology · loopback bindings\n`);
  out.write(`${c.cyan("READY")}  ${c.muted("·")} handoff to operator\n\n`);
  out.write(`${c.phos("● online")}\n\n`);
}
