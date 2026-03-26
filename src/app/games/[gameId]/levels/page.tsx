"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, Trash2, Settings } from "lucide-react";
import type { DifficultyTag, LevelRecord } from "@/types/game";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

export default function LevelsTablePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;

  const [levels, setLevels] = useState<LevelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function fetchLevels() {
      setIsLoading(true);
      setNotice("");

      try {
        const response = await fetch(`/api/games/${gameId}/levels`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to fetch levels.");
        }

        const data = (await response.json()) as LevelRecord[];
        setLevels(data);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to load levels.");
      } finally {
        setIsLoading(false);
      }
    }

    if (gameId) {
      void fetchLevels();
    }
  }, [gameId]);

  async function handleDelete(levelId: number) {
    const accepted = window.confirm("Delete this level?");
    if (!accepted) {
      return;
    }

    setNotice("");

    try {
      const response = await fetch(`/api/games/${gameId}/levels/${levelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete level.");
      }

      setLevels((current) => current.filter((item) => item.id !== levelId));
      setNotice("Level deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  const rows = useMemo(() => {
    return levels.map((level) => {
      const difficultyTag = (level.settings?.difficulty ?? "-") as DifficultyTag | "-";
      const tubeCount = Array.isArray(level.config?.tubes) ? level.config.tubes.length : 0;

      return {
        id: level.id,
        levelNumber: level.levelNumber,
        tubeCount,
        difficultyTag,
        createdAt: level.createdAt,
      };
    });
  }, [levels]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Game Levels</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Levels Management</h2>
          <p className="mt-2 text-sm text-slate-300">Manage levels and navigate to the advanced editor.</p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/games/${gameId}/levels/editor`}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
          >
            Create New Level
          </Link>
          <Link
            href={`/games/${gameId}/settings`}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </header>

      {notice ? (
        <p className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">
          {notice}
        </p>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Level Number</th>
              <th className="px-4 py-3">Tube Count</th>
              <th className="px-4 py-3">Difficulty Tag</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-300">
                  Loading levels...
                </td>
              </tr>
            ) : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-300">
                  No levels yet. Create your first one.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-100">{row.levelNumber}</td>
                    <td className="px-4 py-3 text-slate-300">{row.tubeCount}</td>
                    <td className="px-4 py-3 text-slate-300">{row.difficultyTag}</td>
                    <td className="px-4 py-3 text-slate-300">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/games/${gameId}/levels/editor?levelId=${row.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </section>
    </section>
  );
}
