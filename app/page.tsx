import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white font-bold">M</div>
            <div>
              <div className="text-slate-900 font-semibold leading-none">MCP Usage</div>
              <div className="text-xs text-slate-500">Trace & Visualize</div>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/usage" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 shadow-sm transition">
              Ouvrir le dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="px-6">
        <section className="mx-auto max-w-7xl py-16 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Visualisez l&apos;usage MCP avec style
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Dashboard propre et fluide pour suivre vos outils et prompts. Persistance Azure Table, métriques clés, et data viz intégrée.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/usage" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-md shadow-sm transition">
                Ouvrir le dashboard
              </Link>
              <a
                href="https://modelcontextprotocol.io/"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                En savoir plus sur MCP
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 border border-emerald-200">Traçabilité fine</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 border border-indigo-200">Charts intégrés</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 text-violet-700 px-3 py-1 border border-violet-200">UX soignée</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 via-indigo-100 to-violet-100 blur-2xl rounded-3xl opacity-70" />
            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                  <div className="text-xs text-blue-700">Total</div>
                  <div className="text-2xl font-semibold text-blue-900">—</div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                  <div className="text-xs text-emerald-700">Succès</div>
                  <div className="text-2xl font-semibold text-emerald-900">—</div>
                </div>
                <div className="rounded-xl bg-violet-50 p-4 border border-violet-100">
                  <div className="text-xs text-violet-700">Durée moy.</div>
                  <div className="text-2xl font-semibold text-violet-900">—</div>
                </div>
              </div>
              <div className="mt-6 h-40 rounded-lg bg-slate-50 border border-slate-100 grid place-items-center text-slate-400 text-sm">
                Aperçu visuel du dashboard
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-700 grid place-items-center mb-3">🔒</div>
            <h3 className="font-semibold text-slate-900">Persistance fiable</h3>
            <p className="text-sm text-slate-600 mt-2">Chaque appel outil/prompt est stocké avec horodatage, succès/échec, tailles et erreurs.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-indigo-600/10 text-indigo-700 grid place-items-center mb-3">📊</div>
            <h3 className="font-semibold text-slate-900">Métriques clés</h3>
            <p className="text-sm text-slate-600 mt-2">Durées, taux de succès, histogrammes, et classement des outils les plus utilisés.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-violet-600/10 text-violet-700 grid place-items-center mb-3">✨</div>
            <h3 className="font-semibold text-slate-900">UX moderne</h3>
            <p className="text-sm text-slate-600 mt-2">Interface fluide, lisible, responsive, avec codes couleur clairs.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-sm text-slate-500">
          <span>© {new Date().getFullYear()} MCP Usage</span>
          <Link href="/usage" className="text-slate-600 hover:text-slate-900 transition">Aller au dashboard →</Link>
        </div>
      </footer>
    </div>
  );
}
