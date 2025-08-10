"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";

function ThWithTip({ label, tip }: { label: string; tip: string }) {
  return (
    <th className="py-2 px-3 font-medium text-slate-600">
      <div className="relative inline-flex items-center gap-2 group">
        <span>{label}</span>
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] leading-none text-slate-700">i</span>
        <div className="pointer-events-none absolute left-full top-1/2 z-10 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-md group-hover:block ml-2">
          {tip}
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 rotate-45 h-2 w-2 bg-white border-l border-t border-slate-200"></span>
        </div>
      </div>
    </th>
  );
}

type UsageRow = {
  partitionKey: string;
  rowKey: string;
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
  metadataJson?: string;
};

function todayPartition(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export default function UsagePage() {
  const [date, setDate] = useState<string>(todayPartition());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState<string>("500");

  // Register all Chart.js components once (includes BarController, etc.)
  useEffect(() => {
    Chart.register(...registerables);
  }, []);

  // Aggregations
  const byHour = useMemo(() => {
    const buckets: Record<string, { ok: number; ko: number }> = {};
    for (const r of rows) {
      const d = new Date(r.timestampIso);
      const key = `${String(d.getUTCHours()).padStart(2, "0")}:00`;
      if (!buckets[key]) {
        buckets[key] = { ok: 0, ko: 0 };
      }
      const b = buckets[key];
      if (r.success) b.ok += 1; else b.ko += 1;
    }
    const labels = Object.keys(buckets).sort();
    return {
      labels,
      ok: labels.map((k) => buckets[k].ok),
      ko: labels.map((k) => buckets[k].ko),
    };
  }, [rows]);

  const byTool = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.name] = (counts[r.name] || 0) + 1;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { labels: entries.map((e) => e[0]), data: entries.map((e) => e[1]) };
  }, [rows]);

  const durationHist = useMemo(() => {
    const bins = [
      { label: "<100ms", min: 0, max: 100 },
      { label: "100-300ms", min: 100, max: 300 },
      { label: "300ms-1s", min: 300, max: 1000 },
      { label: "1-3s", min: 1000, max: 3000 },
      { label: ">3s", min: 3000, max: Infinity },
    ];
    const counts = new Array(bins.length).fill(0);
    for (const r of rows) {
      const d = r.totalDurationMs ?? r.durationMs ?? 0;
      const idx = bins.findIndex((b) => d >= b.min && d < b.max);
      if (idx >= 0) counts[idx]++;
    }
    return { labels: bins.map((b) => b.label), data: counts };
  }, [rows]);

  // Chart refs
  const hourRef = useRef<HTMLCanvasElement | null>(null);
  const toolRef = useRef<HTMLCanvasElement | null>(null);
  const durRef = useRef<HTMLCanvasElement | null>(null);
  const hourChart = useRef<Chart | null>(null);
  const toolChart = useRef<Chart | null>(null);
  const durChart = useRef<Chart | null>(null);

  // Render charts
  useEffect(() => {
    if (hourRef.current) {
      hourChart.current?.destroy();
      hourChart.current = new Chart(hourRef.current, {
        type: "bar",
        data: {
          labels: byHour.labels,
          datasets: [
            { label: "Success", data: byHour.ok, backgroundColor: "#16a34a" },
            { label: "Failed", data: byHour.ko, backgroundColor: "#ef4444" },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: "top" as const } } },
      });
    }
  }, [byHour]);

  useEffect(() => {
    if (toolRef.current) {
      toolChart.current?.destroy();
      toolChart.current = new Chart(toolRef.current, {
        type: "bar",
        data: {
          labels: byTool.labels,
          datasets: [{ label: "Calls", data: byTool.data, backgroundColor: "#3b82f6" }],
        },
        options: { indexAxis: "y" as const, responsive: true },
      });
    }
  }, [byTool]);

  useEffect(() => {
    if (durRef.current) {
      durChart.current?.destroy();
      durChart.current = new Chart(durRef.current, {
        type: "bar",
        data: {
          labels: durationHist.labels,
          datasets: [{ label: "Calls", data: durationHist.data, backgroundColor: "#a855f7" }],
        },
        options: { responsive: true },
      });
    }
  }, [durationHist]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(r =>
      [r.name, r.kind, r.transport, r.errorMessage ?? ""].some(x => x?.toLowerCase().includes(q))
    );
  }, [rows, query]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const topParam = Number.parseInt(limit || "500", 10);
      const res = await fetch(`/api/usage?date=${encodeURIComponent(date)}&top=${Number.isFinite(topParam) ? topParam : 500}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load usage");
      setRows(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, limit]);

  const total = rows.length;
  const successCount = rows.filter((r) => r.success).length;
  const successRate = total ? Math.round((successCount / total) * 100) : 0;
  const avgDuration = total
    ? Math.round(
        rows.reduce((acc, r) => acc + (r.totalDurationMs ?? r.durationMs ?? 0), 0) / total
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">MCP Usage</h1>
          <span className="rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 border border-blue-200">Live</span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-slate-600">Date (UTC yyyymmdd)</label>
            <input
              className="border rounded text-blue-700 px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600">Top</label>
            <input
              className="border rounded text-blue-700 px-3 py-2 text-sm w-28"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-slate-600">Recherche</label>
            <input
              className="border rounded text-blue-700 px-3 py-2 text-sm w-full"
              placeholder="outil, modèle, erreur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition"
            onClick={load}
          >
            Recharger
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-slate-500 text-sm">Total appels</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{total}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-slate-500 text-sm">Succès</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">{successCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-slate-500 text-sm">Taux de succès</div>
            <div className="mt-1 text-2xl font-semibold"><span className={successRate >= 80 ? "text-green-600" : successRate >= 50 ? "text-amber-600" : "text-red-600"}>{successRate}%</span></div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-slate-500 text-sm">Durée moyenne</div>
            <div className="mt-1 text-2xl font-semibold text-violet-600">{avgDuration} ms</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium mb-2 text-slate-700">Success par heure (UTC)</div>
            <canvas ref={hourRef} height={160} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium mb-2 text-slate-700">Top outils (10)</div>
            <canvas ref={toolRef} height={160} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium mb-2 text-slate-700">Distribution des durées</div>
            <canvas ref={durRef} height={160} />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="py-2 px-3 font-medium">Time</th>
                <th className="py-2 px-3 font-medium">Transport</th>
                <th className="py-2 px-3 font-medium">Kind</th>
                <th className="py-2 px-3 font-medium">Name</th>
                <th className="py-2 px-3 font-medium">Success</th>
                <ThWithTip label="Compute" tip="Durée du calcul (haute précision), sans inclure la persistance." />
                <ThWithTip label="Total" tip="Durée totale jusqu'à la fin de la persistance (compute + persist)." />
                <ThWithTip label="Input (chars)" tip="Nombre de caractères en entrée (payload envoyé)." />
                <ThWithTip label="Output (chars)" tip="Nombre de caractères en sortie (réponse produite)." />
                <th className="py-2 px-3 font-medium">Model</th>
                <th className="py-2 px-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.rowKey} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 text-slate-700">{new Date(r.timestampIso).toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 border border-sky-200">
                      {r.transport}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border " +
                      (r.kind === "tool"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200")
                    }>
                      {r.kind}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-900">{r.name}</td>
                  <td className="py-2 px-3">
                    {r.success ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <span className="h-2 w-2 rounded-full bg-green-500" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <span className="h-2 w-2 rounded-full bg-red-500" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-blue-700">{r.durationMs ?? "-"} ms</td>
                  <td className="py-2 px-3 text-blue-700">{r.totalDurationMs ?? (r.durationMs ?? "-")} ms</td>
                  <td className="py-2 px-3 text-blue-700">{r.inputChars ?? 0}</td>
                  <td className="py-2 px-3 text-blue-700">{r.outputChars ?? 0}</td>
                  <td className="py-2 px-3 text-slate-600">{r.model ?? "-"}</td>
                  <td className="py-2 px-3 max-w-[320px] truncate" title={r.errorMessage || ""}>
                    {r.errorMessage ? (
                      <span className="text-red-600">{r.errorMessage}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-slate-500">No data</div>
        )}
      </div>
    </div>
  );
}
