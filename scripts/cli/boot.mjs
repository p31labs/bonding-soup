/**
 * Single boot path: ANSI payload (see boot-payload.mjs). No duplicate INIT/MESH/READY.
 */

import process from "node:process";
import { writeBootPayload } from "./boot-payload.mjs";

/**
 * @param {{ write: (s: string) => void }} out
 */
export async function runBoot(out = process.stdout) {
  writeBootPayload(out);
}
