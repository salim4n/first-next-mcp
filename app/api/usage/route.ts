import { NextRequest, NextResponse } from "next/server";
import { listUsage } from "@/lib/usage/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined; // yyyymmdd
    const top = searchParams.get("top");
    const n = top ? Math.min(Math.max(parseInt(top, 10) || 0, 1), 1000) : undefined;
    const rows = await listUsage({ date, top: n });
    return NextResponse.json({ items: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
