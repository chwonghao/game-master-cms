"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Save } from "lucide-react";
import type { GameRecord, PlayerRecord } from "@/types/game";

type EditablePlayerFields = {
  gameId: number | null;
  coins: number;
  gems: number;
  currentLevel: number;
  xp: number;
  deviceId: string;
  sessionId: string;
};

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
}

function toEditable(player: PlayerRecord): EditablePlayerFields {
  return {
    gameId: player.gameId ?? null,
    coins: player.coins,
    gems: player.gems,
    currentLevel: player.currentLevel,
    xp: player.xp,
    deviceId: player.deviceId ?? "",
    sessionId: player.sessionId ?? "",
  };
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditablePlayerFields | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setNotice("");

      try {
        const [playersResponse, gamesResponse] = await Promise.all([
          fetch("/api/players", { cache: "no-store" }),
          fetch("/api/games", { cache: "no-store" }),
        ]);

        if (!playersResponse.ok) {
          throw new Error("Unable to fetch players.");
        }

        if (!gamesResponse.ok) {
          throw new Error("Unable to fetch games.");
        }

        const playersData = (await playersResponse.json()) as PlayerRecord[];
        const gamesData = (await gamesResponse.json()) as GameRecord[];

        setPlayers(playersData);
        setGames(gamesData);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to load players.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchData();
  }, []);

  function handleViewDetails(player: PlayerRecord) {
    setSelectedPlayerId(player.id);
    setEditor(toEditable(player));
  }

  async function handleSavePlayer() {
    if (!selectedPlayer || !editor) {
      return;
    }

    setIsSaving(true);
    setNotice("");

    try {
      const response = await fetch(`/api/players/${selectedPlayer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: editor.gameId,
          coins: editor.coins,
          gems: editor.gems,
          currentLevel: editor.currentLevel,
          xp: editor.xp,
          deviceId: editor.deviceId,
          sessionId: editor.sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to update player.");
      }

      const updated = (await response.json()) as PlayerRecord;
      setPlayers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedPlayerId(updated.id);
      setEditor(toEditable(updated));
      setNotice("Player updated successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to update player.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Community Ops</p>
        <h2 className="text-3xl font-semibold tracking-tight">Player Directory</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          View account, device, session and economy state across games for support and live-ops actions.
        </p>
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
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Economy</th>
              <th className="px-4 py-3">Device / Session</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-300">
                  Loading players...
                </td>
              </tr>
            ) : null}

            {!isLoading && players.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-300">
                  No players found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? players.map((player) => (
                  <tr key={player.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-100">{player.username}</p>
                      <p className="text-xs text-slate-400">{player.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {player.game?.title ?? (player.gameId ? `Game #${player.gameId}` : "Unassigned")}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <p>Coins: {player.coins}</p>
                      <p>Gems: {player.gems}</p>
                      <p>Level: {player.currentLevel}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <p>deviceId: {player.deviceId ?? "-"}</p>
                      <p>sessionId: {player.sessionId ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDateTime(player.lastLogin)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(player)}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </section>

      {selectedPlayer && editor ? (
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Player Detail</h3>
              <p className="text-sm text-slate-300">
                {selectedPlayer.username} ({selectedPlayer.email})
              </p>
            </div>
            <button
              type="button"
              onClick={handleSavePlayer}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Game</span>
              <select
                value={editor.gameId ?? 0}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setEditor((current) =>
                    current
                      ? {
                          ...current,
                          gameId: value === 0 ? null : value,
                        }
                      : current,
                  );
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
              >
                <option value={0}>Unassigned</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Coins</span>
              <input
                type="number"
                min={0}
                value={editor.coins}
                onChange={(event) =>
                  setEditor((current) =>
                    current
                      ? { ...current, coins: Math.max(0, Number(event.target.value) || 0) }
                      : current,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Gems</span>
              <input
                type="number"
                min={0}
                value={editor.gems}
                onChange={(event) =>
                  setEditor((current) =>
                    current
                      ? { ...current, gems: Math.max(0, Number(event.target.value) || 0) }
                      : current,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Current Level</span>
              <input
                type="number"
                min={1}
                value={editor.currentLevel}
                onChange={(event) =>
                  setEditor((current) =>
                    current
                      ? {
                          ...current,
                          currentLevel: Math.max(1, Number(event.target.value) || 1),
                        }
                      : current,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-slate-300">XP</span>
              <input
                type="number"
                min={0}
                value={editor.xp}
                onChange={(event) =>
                  setEditor((current) =>
                    current
                      ? { ...current, xp: Math.max(0, Number(event.target.value) || 0) }
                      : current,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="space-y-1 text-sm lg:col-span-3">
              <span className="text-slate-300">deviceId</span>
              <input
                value={editor.deviceId}
                onChange={(event) =>
                  setEditor((current) =>
                    current
                      ? {
                          ...current,
                          deviceId: event.target.value,
                        }
                      : current,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="space-y-1 text-sm lg:col-span-3">
              <span className="text-slate-300">sessionId</span>
              <input
                value={editor.sessionId}
                onChange={(event) =>
                  setEditor((current) =>
                    current
                      ? {
                          ...current,
                          sessionId: event.target.value,
                        }
                      : current,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
            <p>Player ID: {selectedPlayer.id}</p>
            <p>Provider ID: {selectedPlayer.providerId ?? "-"}</p>
            <p>Last Login: {formatDateTime(selectedPlayer.lastLogin)}</p>
            <p>Created At: {formatDateTime(selectedPlayer.createdAt)}</p>
          </div>
        </section>
      ) : null}
    </section>
  );
}
