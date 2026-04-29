/** Pull a single JSON object from model text (markdown fence tolerant). */

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence ? fence[1] : trimmed).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new SyntaxError('No JSON object found in model output');
  }
  const slice = candidate.slice(start, end + 1);
  return JSON.parse(slice) as unknown;
}
