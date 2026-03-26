"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { GameRecord } from "@/types/game";

interface GameSettings {
  interstitialAdCooldown?: number;
  enableRewardedAds?: boolean;
  maxUndoLimitPerDay?: number;
}

export default function GameSettingsPage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const gameId = params.gameId;

  const [game, setGame] = useState<GameRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState<GameSettings>({
    interstitialAdCooldown: 30,
    enableRewardedAds: true,
    maxUndoLimitPerDay: 10,
  });

  useEffect(() => {
    async function fetchGame() {
      setIsLoading(true);
      setNotice("");

      try {
        const response = await fetch(`/api/games/${gameId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load game.");
        }

        const data = (await response.json()) as GameRecord;
        setGame(data);

        // Load existing settings if they exist
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...(data.settings as GameSettings),
          }));
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to load game.");
      } finally {
        setIsLoading(false);
      }
    }

    if (gameId) {
      void fetchGame();
    }
  }, [gameId]);

  async function handleSave() {
    if (!gameId) return;

    setIsSaving(true);
    setNotice("");

    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Save failed.");
      }

      const updated = (await response.json()) as GameRecord;
      setGame(updated);
      setNotice("Settings saved successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-slate-300">Loading game settings...</p>
      </section>
    );
  }

  if (!game) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-slate-300">Game not found.</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href={`/games/${gameId}/levels`} className="hover:text-cyan-300">
              <ArrowLeft className="h-4 w-4 inline-block mr-1" />
              Back to Levels
            </Link>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">Game Settings</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            {game.title} - Monetization & Live-Ops Configuration
          </p>
        </div>
      </header>

      {notice && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
          {notice}
        </div>
      )}

      {/* Settings Form */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 space-y-8">
        {/* Monetization Section */}
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Monetization</p>
            <h3 className="mt-2 text-lg font-semibold">Ad Configuration</h3>
          </div>

          {/* Interstitial Ad Cooldown */}
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-medium text-slate-300">
                Interstitial Ad Cooldown (seconds)
              </span>
              <input
                type="number"
                min={0}
                max={600}
                step={5}
                value={settings.interstitialAdCooldown ?? 30}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    interstitialAdCooldown: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              />
              <p className="text-xs text-slate-400">
                Minimum time between interstitial ad displays. Recommended: 30-60 seconds.
              </p>
            </label>

            {/* Enable Rewarded Ads Toggle */}
            <label className="space-y-2">
              <span className="block text-sm font-medium text-slate-300">
                Enable Rewarded Ads
              </span>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    enableRewardedAds: !prev.enableRewardedAds,
                  }))
                }
                className={`${
                  settings.enableRewardedAds ? "bg-emerald-500/20" : "bg-slate-700/20"
                } w-full rounded-lg border ${
                  settings.enableRewardedAds
                    ? "border-emerald-400/40"
                    : "border-slate-700"
                } px-4 py-3 text-left font-medium transition`}
              >
                <div className="flex items-center justify-between">
                  <span className={settings.enableRewardedAds ? "text-emerald-200" : "text-slate-300"}>
                    {settings.enableRewardedAds ? "Enabled" : "Disabled"}
                  </span>
                  <div
                    className={`h-6 w-10 rounded-full transition ${
                      settings.enableRewardedAds ? "bg-emerald-500" : "bg-slate-600"
                    }`}
                  />
                </div>
              </button>
              <p className="text-xs text-slate-400">
                Allow players to watch ads for in-game rewards or hints.
              </p>
            </label>
          </div>
        </div>

        {/* Live-Ops Section */}
        <div className="border-t border-slate-700 pt-8 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Live-Ops</p>
            <h3 className="mt-2 text-lg font-semibold">Player Limits</h3>
          </div>

          <label className="space-y-2 max-w-lg">
            <span className="block text-sm font-medium text-slate-300">
              Max Undo Limit per Day
            </span>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={settings.maxUndoLimitPerDay ?? 10}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maxUndoLimitPerDay: parseInt(e.target.value, 10),
                }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
            <p className="text-xs text-slate-400">
              Total undo actions available to players per day across all levels. Set to 0 for
              unlimited.
            </p>
          </label>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-indigo-500/10 border border-indigo-400/30 p-4 mt-8">
          <p className="text-sm text-indigo-300">
            💡 <strong>Tip:</strong> These settings are sent to the Unity game client at startup
            via the <code className="bg-slate-800/50 px-2 py-1 rounded text-xs">GET /api/games/[gameId]</code> endpoint. Configure
            carefully to balance monetization and player experience.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        <Link
          href={`/games/${gameId}/levels`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
        >
          Cancel
        </Link>
      </div>
    </section>
  );
}
