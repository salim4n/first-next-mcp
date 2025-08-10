export type UsageEvent = {
  transport: string; // e.g., "http"
  kind: "tool" | "prompt";
  name: string; // tool or prompt name
  success: boolean;
  startedAt: string; // ISO
  durationMs: number;
  totalDurationMs?: number;
  inputChars?: number;
  outputChars?: number;
  model?: string;
  sessionId?: string;
  userAgent?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

export type UsageEntity = {
  partitionKey: string; // yyyymmdd
  rowKey: string; // uuid/ulid
  timestampIso: string;
  transport: string;
  kind: "tool" | "prompt";
  name: string;
  success: boolean;
  durationMs: number;
  totalDurationMs?: number;
  inputChars?: number;
  outputChars?: number;
  model?: string;
  sessionId?: string;
  userAgent?: string;
  errorCode?: string;
  errorMessage?: string;
  // store metadata as JSON string for Azure Table
  metadataJson?: string;
};

export function toPartition(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
