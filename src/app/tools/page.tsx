"use client";

import { useState } from "react";

export default function ToolsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState("");

  async function exportAllDataToJson() {
    setIsExporting(true);
    setNotice("");

    try {
      const response = await fetch("/api/export", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        throw new Error(errorBody.error ?? "Export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");

      link.href = url;
      link.download = `gamemaster-export-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setNotice("Export complete. JSON download started.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Operations</p>
        <h2 className="text-3xl font-semibold tracking-tight">Tools</h2>
        <p className="text-sm text-slate-300">
          Utility actions for administration and data portability.
        </p>
      </header>

      <article className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-slate-100">Data Export</h3>
        <p className="mt-2 text-sm text-slate-300">
          Download all games with their level configurations as a single JSON snapshot.
        </p>

        <button
          type="button"
          onClick={exportAllDataToJson}
          disabled={isExporting}
          className="mt-5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Exporting..." : "Export All Data to JSON"}
        </button>

        {notice ? (
          <p className="mt-4 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
            {notice}
          </p>
        ) : null}
      </article>
    </section>
  );
}
