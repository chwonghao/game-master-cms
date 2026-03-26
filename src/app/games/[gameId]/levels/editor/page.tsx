"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Download, Eraser, Plus, RotateCcw, Save, Shuffle, Trash2 } from "lucide-react";
import { TubeBoard } from "@/components/level-editor/TubeBoard";
import {
  evaluateDifficulty,
  generateRandomSolvableLevel,
} from "@/lib/level-tools";
import { buildLevelPayload, useLevelEditorStore } from "@/stores/useLevelEditorStore";
import type { DifficultyTag, LevelRecord } from "@/types/game";

const woolPalette = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
];

export default function CozyTailorShopLevelEditorPage() {
  const params = useParams<{ gameId: string }>();
  const searchParams = useSearchParams();
  const gameId = params.gameId;
  const editingLevelId = searchParams.get("levelId");

  const {
    levelNumber,
    undoLimit,
    tubeCapacity,
    selectedTube,
    tubes,
    setLevelNumber,
    setUndoLimit,
    setTubeCapacity,
    selectTube,
    addTube,
    removeTube,
    addWoolToTube,
    clearTube,
    moveWool,
    undo,
    resetBoard,
    loadFromConfig,
    setTubes,
  } = useLevelEditorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string>("");

  const [generatorColors, setGeneratorColors] = useState(6);
  const [generatorEmptyTubes, setGeneratorEmptyTubes] = useState(2);
  const [generatorIterations, setGeneratorIterations] = useState(60);

  const selectedCount = selectedTube === null ? 0 : tubes[selectedTube]?.length ?? 0;
  const canRemoveTube = selectedTube !== null && selectedCount === 0;

  const difficulty = useMemo(() => evaluateDifficulty(tubes, tubeCapacity), [tubeCapacity, tubes]);

  const validation = useMemo(() => {
    const colorCount = new Map<string, number>();
    let overfilledTubes = 0;

    for (const tube of tubes) {
      if (tube.length > tubeCapacity) {
        overfilledTubes += 1;
      }

      for (const wool of tube) {
        colorCount.set(wool, (colorCount.get(wool) ?? 0) + 1);
      }
    }

    const irregularColors = Array.from(colorCount.entries())
      .filter(([, count]) => count % tubeCapacity !== 0)
      .map(([color]) => color);

    const emptyTubes = tubes.filter((tube) => tube.length === 0).length;
    const filledTubes = tubes.filter((tube) => tube.length > 0).length;

    const warnings: string[] = [];
    if (overfilledTubes > 0) {
      warnings.push(`${overfilledTubes} tube(s) exceed capacity.`);
    }
    if (irregularColors.length > 0) {
      warnings.push("Some colors do not fill complete groups for this capacity.");
    }
    if (emptyTubes < 2) {
      warnings.push("Recommended: keep at least 2 empty tubes for solvability.");
    }
    if (filledTubes === 0) {
      warnings.push("Board has no wool yet.");
    }

    return {
      emptyTubes,
      uniqueColors: colorCount.size,
      warnings,
      isValid: warnings.length === 0,
    };
  }, [tubeCapacity, tubes]);

  useEffect(() => {
    async function fetchEditingLevel() {
      if (!editingLevelId) {
        return;
      }

      setIsLoading(true);
      setNotice("");

      try {
        const response = await fetch(`/api/games/${gameId}/levels/${editingLevelId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load requested level.");
        }

        const level = (await response.json()) as LevelRecord;
        setLevelNumber(level.levelNumber);
        loadFromConfig(level.config, level.settings);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to load level.");
      } finally {
        setIsLoading(false);
      }
    }

    if (gameId) {
      void fetchEditingLevel();
    }
  }, [editingLevelId, gameId, loadFromConfig, setLevelNumber]);

  function handleTubeClick(index: number) {
    if (selectedTube === null) {
      selectTube(index);
      return;
    }

    if (selectedTube === index) {
      selectTube(null);
      return;
    }

    moveWool(selectedTube, index);
  }

  function handleWoolDrop(from: number, to: number) {
    moveWool(from, to);
  }

  function generateLevel() {
    const generatedTubes = generateRandomSolvableLevel({
      numberOfColors: generatorColors,
      numberOfEmptyTubes: generatorEmptyTubes,
      tubeCapacity,
      shuffleIterations: generatorIterations,
      palette: woolPalette,
    });

    setTubes(generatedTubes);
    setNotice("Generated a random solvable level.");
  }

  async function saveLevel() {
    setIsSaving(true);
    setNotice("");

    try {
      const payload = buildLevelPayload({
        levelNumber,
        tubes,
        undoLimit,
        tubeCapacity,
        difficultyTag: difficulty.tag,
        difficultyScore: difficulty.score,
      });

      const target = editingLevelId
        ? `/api/games/${gameId}/levels/${editingLevelId}`
        : `/api/games/${gameId}/levels`;

      const response = await fetch(target, {
        method: editingLevelId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Save failed.");
      }

      setNotice(editingLevelId ? "Level updated successfully." : "Level saved successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  function downloadForUnity() {
    // Map hex color strings to palette indices
    const colorToPaletteIndex = (hexColor: string): number => {
      const index = woolPalette.indexOf(hexColor);
      return index >= 0 ? index : 0;
    };

    // Format tubes for client export
    const exportTubes = tubes.map((tube) => ({
      wools: tube.map(colorToPaletteIndex),
    }));

    // Build the export payload
    const exportPayload = {
      level_id: levelNumber,
      settings: {
        tube_capacity: tubeCapacity,
        undo_limit: undoLimit,
      },
      tubes: exportTubes,
    };

    // Create and trigger download
    const dataStr = JSON.stringify(exportPayload, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `level_${levelNumber}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotice("Level exported for Unity.");
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Cozy Tailor Shop</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Level Editor</h2>
            <p className="mt-2 text-sm text-slate-300">
              Reverse-shuffle generator and automatic difficulty grading are enabled.
            </p>
          </div>

          <Link
            href={`/games/${gameId}/levels`}
            className="rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700"
          >
            Back to Levels
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Level Number</span>
            <input
              type="number"
              min={1}
              value={levelNumber}
              onChange={(event) => setLevelNumber(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none ring-cyan-400/50 focus:ring"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Undo Limit</span>
            <input
              type="number"
              min={0}
              value={undoLimit}
              onChange={(event) => setUndoLimit(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none ring-cyan-400/50 focus:ring"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Tube Capacity</span>
            <input
              type="number"
              min={2}
              max={8}
              value={tubeCapacity}
              onChange={(event) => setTubeCapacity(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none ring-cyan-400/50 focus:ring"
            />
          </label>

          <div className="space-y-1 text-sm">
            <span className="text-slate-300">Difficulty</span>
            <p className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 font-semibold text-cyan-200">
              {difficulty.tag} (Score {difficulty.score})
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Number of Colors</span>
            <input
              type="number"
              min={2}
              max={12}
              value={generatorColors}
              onChange={(event) => setGeneratorColors(Math.max(2, Number(event.target.value) || 2))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Empty Tubes</span>
            <input
              type="number"
              min={1}
              max={6}
              value={generatorEmptyTubes}
              onChange={(event) => setGeneratorEmptyTubes(Math.max(1, Number(event.target.value) || 1))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Shuffle Iterations</span>
            <input
              type="number"
              min={10}
              max={500}
              value={generatorIterations}
              onChange={(event) => setGeneratorIterations(Math.max(10, Number(event.target.value) || 10))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={generateLevel}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
            >
              <Shuffle className="h-4 w-4" />
              Generate Random Level
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addTube}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Tube
          </button>
          <button
            type="button"
            onClick={undo}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Undo
          </button>
          <button
            type="button"
            onClick={resetBoard}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/20"
          >
            <Eraser className="h-4 w-4" />
            Reset Board
          </button>
          <button
            type="button"
            onClick={saveLevel}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : editingLevelId ? "Update Level" : "Save Level"}
          </button>
          <button
            type="button"
            onClick={downloadForUnity}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/20"
          >
            <Download className="h-4 w-4" />
            Download for Unity
          </button>
        </div>

        {isLoading ? <p className="mt-3 text-sm text-slate-300">Loading level...</p> : null}

        {notice ? (
          <p className="mt-4 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
            {notice}
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tube Board</h3>
          <p className="text-xs uppercase tracking-wide text-slate-400">Drag and drop supported</p>
        </div>

        <TubeBoard
          tubes={tubes}
          selectedTube={selectedTube}
          tubeCapacity={tubeCapacity}
          onTubeClick={handleTubeClick}
          onWoolDrop={handleWoolDrop}
        />

        <div className="mt-6 flex flex-wrap gap-2">
          {woolPalette.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                if (selectedTube !== null) {
                  addWoolToTube(selectedTube, color);
                }
              }}
              className="h-9 w-9 rounded-full border border-white/20 shadow"
              style={{ backgroundColor: color }}
              aria-label={`Add wool ${color}`}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canRemoveTube}
            onClick={() => {
              if (selectedTube !== null) {
                removeTube(selectedTube);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Remove Selected Empty Tube
          </button>
          <button
            type="button"
            disabled={selectedTube === null}
            onClick={() => {
              if (selectedTube !== null) {
                clearTube(selectedTube);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-200 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear Selected Tube
          </button>
        </div>

        <section className="mt-6 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100">Validation</h4>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                validation.isValid
                  ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                  : "border border-amber-400/40 bg-amber-500/15 text-amber-300"
              }`}
            >
              {validation.isValid ? "Ready" : "Needs Attention"}
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
            <p>Unique Colors: {validation.uniqueColors}</p>
            <p>Empty Tubes: {validation.emptyTubes}</p>
            <p>Heuristic Moves: {difficulty.estimatedMinimumMoves}</p>
          </div>

          {validation.warnings.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-200">
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-emerald-200">Structure checks passed.</p>
          )}

          <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
            <p>Entropy: {difficulty.colorEntropy}</p>
            <p>Hidden Blocks: {difficulty.hiddenBlocks}</p>
            <p>Difficulty Tag: {difficulty.tag as DifficultyTag}</p>
          </div>
        </section>
      </section>
    </section>
  );
}
