"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GameRecord, GameStatus } from "@/types/game";

const statusOptions: GameStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

type NewGameForm = {
  title: string;
  genre: string;
  status: GameStatus;
};

const initialForm: NewGameForm = {
  title: "",
  genre: "Puzzle",
  status: "DRAFT",
};

export default function GamesPage() {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<NewGameForm>(initialForm);

  useEffect(() => {
    async function fetchGames() {
      setIsLoading(true);
      setNotice("");

      try {
        const response = await fetch("/api/games", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to fetch games.");
        }

        const data = (await response.json()) as GameRecord[];
        setGames(data);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to load games.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchGames();
  }, []);

  async function handleCreateGame(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice("");

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Unable to create game.");
      }

      const created = (await response.json()) as GameRecord;
      setGames((current) => [created, ...current]);
      setForm(initialForm);
      setIsCreateOpen(false);
      setNotice("Game created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Create failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Library</p>
          <h2 className="text-3xl font-semibold tracking-tight">Games</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Manage all game workspaces and jump into level operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
        >
          Create New Game
        </button>
      </header>

      {notice ? (
        <p className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {isLoading ? (
          <p className="text-sm text-slate-300">Loading games...</p>
        ) : null}

        {!isLoading && games.length === 0 ? (
          <p className="text-sm text-slate-300">No games found. Create your first game.</p>
        ) : null}

        {games.map((game) => (
          <article key={game.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{game.genre}</p>
                <h3 className="mt-2 text-xl font-semibold">{game.title}</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Levels: {game._count?.levels ?? 0} | Events: {game._count?.analytics ?? 0}
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                {game.status}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/games/${game.id}/levels`}
                className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
              >
                Open Levels
              </Link>
            </div>
          </article>
        ))}
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create New Game</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateGame} className="space-y-4">
              <label className="block space-y-1 text-sm">
                <span className="text-slate-300">Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-slate-300">Genre</span>
                <input
                  required
                  value={form.genre}
                  onChange={(event) => setForm((current) => ({ ...current, genre: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-slate-300">Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as GameStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create Game"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
