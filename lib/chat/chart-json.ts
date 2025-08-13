// Utilities to detect and extract chart payload JSON blocks from assistant text

export type ChartPiePayload = {
  type: 'pie-chart';
  data: { labels: string[]; values: number[]; colors?: string[] };
  title?: string;
  description?: string;
};

export type ChartBarPayload = {
  type: 'bar-chart';
  data: { labels: string[]; values: number[]; label?: string; color?: string };
  title?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
};

export type MetricsPayload = {
  type: 'metrics-card';
  metrics: Array<{
    label: string;
    value: string | number;
    change?: { value: number; type: 'increase' | 'decrease' };
    icon?: string;
  }>;
  title?: string;
  description?: string;
};

export type AssistantRichContent = ChartPiePayload | ChartBarPayload | MetricsPayload;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isStringArray(v: unknown): v is string[] { return Array.isArray(v) && v.every(x => typeof x === 'string'); }
function isNumberArray(v: unknown): v is number[] { return Array.isArray(v) && v.every(x => typeof x === 'number'); }

export function isChartPayload(v: unknown): v is AssistantRichContent {
  if (!isRecord(v)) return false;
  const rec = v as Record<string, unknown>;
  const typeVal = rec.type;
  if (typeVal !== 'pie-chart' && typeVal !== 'bar-chart' && typeVal !== 'metrics-card') return false;
  if (typeVal === 'pie-chart' || typeVal === 'bar-chart') {
    const data = rec.data;
    if (!isRecord(data)) return false;
    const labels = (data as Record<string, unknown>).labels;
    const values = (data as Record<string, unknown>).values;
    return isStringArray(labels) && isNumberArray(values);
  }
  // metrics-card
  const metrics = rec.metrics;
  return Array.isArray(metrics);
}

export function extractAndRemoveChartJsonBlocks(text: string): { cleanedText: string; charts: AssistantRichContent[] } | null {
  const charts: AssistantRichContent[] = [];
  let cleaned = text;

  // 1) Fenced ```json ... ``` blocks
  const fenceJsonRegex = /```json\s*([\s\S]*?)\s*```/g;
  cleaned = cleaned.replace(fenceJsonRegex, (_match, jsonBody: string) => {
    try {
      const parsed: unknown = JSON.parse(String(jsonBody).trim());
      if (isChartPayload(parsed)) {
        charts.push(parsed);
        return '';
      }
    } catch {}
    return _match;
  });

  // 2) Generic fenced ``` ... ``` blocks (no language)
  const fenceGenericRegex = /```\s*([\s\S]*?)\s*```/g;
  cleaned = cleaned.replace(fenceGenericRegex, (_match, body: string) => {
    try {
      const parsed: unknown = JSON.parse(String(body).trim());
      if (isChartPayload(parsed)) {
        charts.push(parsed);
        return '';
      }
    } catch {}
    return _match;
  });

  // 3) Inline single-line JSON objects
  const lines = cleaned.split('\n');
  const kept: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (isChartPayload(parsed)) {
          charts.push(parsed);
          continue;
        }
      } catch {}
    }
    kept.push(line);
  }
  cleaned = kept.join('\n');

  // 4) Multi-line bare JSON objects: scan and remove top-level balanced braces blocks that parse as chart payloads
  // We attempt repeatedly until no more matches
  const tryExtractMultiline = (input: string): { text: string; found: boolean } => {
    const s = input;
    const len = s.length;
    for (let i = 0; i < len; i++) {
      if (s[i] === '{') {
        let depth = 0;
        for (let j = i; j < len; j++) {
          const ch = s[j];
          if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) {
              const candidate = s.slice(i, j + 1);
              try {
                const parsed: unknown = JSON.parse(candidate);
                if (isChartPayload(parsed)) {
                  charts.push(parsed);
                  const before = s.slice(0, i);
                  const after = s.slice(j + 1);
                  return { text: before + after, found: true };
                }
              } catch {}
              break; // stop scanning this block; move outer i forward
            }
          }
        }
      }
    }
    return { text: s, found: false };
  };

  while (true) {
    const { text: next, found } = tryExtractMultiline(cleaned);
    cleaned = next;
    if (!found) break;
  }

  return charts.length > 0 ? { cleanedText: cleaned, charts } : null;
}
