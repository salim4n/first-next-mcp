import { TableClient } from "@azure/data-tables";

const TABLE_NAME = process.env.AZURE_TABLES_USAGE_TABLE || "mcpusage";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

let clientPromise: Promise<TableClient> | null = null;

export async function getUsageTableClient(): Promise<TableClient> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const conn = requireEnv("AZURE_TABLES_CONNECTION_STRING");
    const lower = conn.toLowerCase();
    const insecureEnv = String(process.env.AZURE_TABLES_ALLOW_INSECURE || "").toLowerCase() === "true";
    const isHttp = lower.includes("defaultendpointsprotocol=http") || lower.includes("tableendpoint=http:");
    const allowInsecureConnection = insecureEnv || isHttp;

    const client = TableClient.fromConnectionString(conn, TABLE_NAME, {
      allowInsecureConnection,
    });
    // Ensure table exists
    try {
      await client.createTable();
    } catch {
      // If already exists, ignore. Azure SDK throws conflict on existing tables.
    }
    return client;
  })();
  return clientPromise;
}
