import { getUsageTableClient } from "../azure/table";
import { UsageEntity, UsageEvent, toPartition } from "./types";

// Lightweight uuid fallback to avoid extra deps if needed
function safeUuid(): string {
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g.crypto && typeof g.crypto.randomUUID === "function") {
    try { return g.crypto.randomUUID(); } catch { /* ignore */ }
  }
  // Fallback if crypto not available
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function persistUsage(evt: UsageEvent): Promise<void> {
  const client = await getUsageTableClient();
  const start = new Date(evt.startedAt);
  const entity: UsageEntity = {
    partitionKey: toPartition(start),
    rowKey: safeUuid(),
    timestampIso: new Date().toISOString(),
    transport: evt.transport,
    kind: evt.kind,
    name: evt.name,
    success: evt.success,
    durationMs: evt.durationMs,
    inputChars: evt.inputChars,
    outputChars: evt.outputChars,
    model: evt.model,
    sessionId: evt.sessionId,
    userAgent: evt.userAgent,
    errorCode: evt.errorCode,
    errorMessage: evt.errorMessage,
    metadataJson: evt.metadata ? JSON.stringify(evt.metadata) : undefined,
  };
  await client.createEntity(entity);
}

export type UsageQueryOptions = {
  date?: string; // yyyymmdd; default today UTC
  top?: number; // max results
};

export async function listUsage(options: UsageQueryOptions = {}): Promise<Record<string, unknown>[]> {
  const client = await getUsageTableClient();
  const date = options.date ?? toPartition(new Date());
  const top = options.top ?? 200;
  const entities: Record<string, unknown>[] = [];
  const iter = client.listEntities({ queryOptions: { filter: `PartitionKey eq '${date}'` } });
  for await (const entity of iter) {
    entities.push(entity as unknown as Record<string, unknown>);
    if (entities.length >= top) break;
  }
  // Most recent first by timestampIso
  entities.sort((a, b) => String(b.timestampIso).localeCompare(String(a.timestampIso)));
  return entities;
}
