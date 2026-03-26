import { create } from "zustand";

type HistorySnapshot = {
  tubes: string[][];
};

const editorPalette = [
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

type LevelEditorState = {
  levelNumber: number;
  undoLimit: number;
  tubeCapacity: number;
  tubes: string[][];
  selectedTube: number | null;
  history: HistorySnapshot[];
  setLevelNumber: (value: number) => void;
  setUndoLimit: (value: number) => void;
  setTubeCapacity: (value: number) => void;
  selectTube: (index: number | null) => void;
  addTube: () => void;
  removeTube: (index: number) => void;
  addWoolToTube: (index: number, color: string) => void;
  clearTube: (index: number) => void;
  moveWool: (from: number, to: number) => void;
  undo: () => void;
  resetBoard: () => void;
  loadFromConfig: (config: unknown, settings: unknown) => void;
  setTubes: (tubes: string[][]) => void;
};

const defaultTubes = [
  ["#ef4444", "#22c55e", "#3b82f6", "#f97316"],
  ["#f97316", "#3b82f6", "#22c55e", "#ef4444"],
  ["#a855f7", "#f59e0b", "#14b8a6", "#a855f7"],
  ["#14b8a6", "#f59e0b"],
  [],
  [],
];

function cloneTubes(tubes: string[][]): string[][] {
  return tubes.map((tube) => [...tube]);
}

export const useLevelEditorStore = create<LevelEditorState>((set, get) => ({
  levelNumber: 1,
  undoLimit: 5,
  tubeCapacity: 4,
  tubes: cloneTubes(defaultTubes),
  selectedTube: null,
  history: [],

  setLevelNumber: (value) => set({ levelNumber: Math.max(1, Math.floor(value || 1)) }),

  setUndoLimit: (value) => set({ undoLimit: Math.max(0, Math.floor(value || 0)) }),

  setTubeCapacity: (value) => {
    const capacity = Math.max(2, Math.min(8, Math.floor(value || 4)));
    set((state) => ({
      tubeCapacity: capacity,
      tubes: state.tubes.map((tube) => tube.slice(0, capacity)),
    }));
  },

  selectTube: (index) => set({ selectedTube: index }),

  addTube: () => {
    set((state) => ({
      tubes: [...cloneTubes(state.tubes), []],
    }));
  },

  removeTube: (index) => {
    set((state) => {
      if (index < 0 || index >= state.tubes.length) {
        return state;
      }

      const next = cloneTubes(state.tubes);
      next.splice(index, 1);
      return {
        tubes: next,
        selectedTube: null,
      };
    });
  },

  addWoolToTube: (index, color) => {
    set((state) => {
      if (index < 0 || index >= state.tubes.length) {
        return state;
      }

      const next = cloneTubes(state.tubes);
      if (next[index].length >= state.tubeCapacity) {
        return state;
      }

      const history = [...state.history, { tubes: cloneTubes(state.tubes) }];
      next[index].push(color);

      return {
        tubes: next,
        history: history.slice(-state.undoLimit),
      };
    });
  },

  clearTube: (index) => {
    set((state) => {
      if (index < 0 || index >= state.tubes.length || state.tubes[index].length === 0) {
        return state;
      }

      const next = cloneTubes(state.tubes);
      const history = [...state.history, { tubes: cloneTubes(state.tubes) }];
      next[index] = [];

      return {
        tubes: next,
        selectedTube: null,
        history: history.slice(-state.undoLimit),
      };
    });
  },

  moveWool: (from, to) => {
    set((state) => {
      if (
        from < 0 ||
        to < 0 ||
        from >= state.tubes.length ||
        to >= state.tubes.length ||
        from === to
      ) {
        return state;
      }

      const fromTube = state.tubes[from];
      const toTube = state.tubes[to];
      if (fromTube.length === 0 || toTube.length >= state.tubeCapacity) {
        return state;
      }

      const movingColor = fromTube[fromTube.length - 1];
      const topTargetColor = toTube[toTube.length - 1];
      if (topTargetColor && topTargetColor !== movingColor) {
        return state;
      }

      const next = cloneTubes(state.tubes);
      const history = [...state.history, { tubes: cloneTubes(state.tubes) }];
      next[from].pop();
      next[to].push(movingColor);

      return {
        tubes: next,
        selectedTube: null,
        history: history.slice(-state.undoLimit),
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) {
        return state;
      }

      const previous = state.history[state.history.length - 1];
      return {
        tubes: cloneTubes(previous.tubes),
        selectedTube: null,
        history: state.history.slice(0, -1),
      };
    });
  },

  resetBoard: () => {
    set({
      tubes: cloneTubes(defaultTubes),
      selectedTube: null,
      history: [],
    });
  },

  loadFromConfig: (config, settings) => {
    let nextTubes = cloneTubes(defaultTubes);

    if (
      typeof config === "object" &&
      config !== null &&
      "tubes" in config &&
      Array.isArray((config as { tubes?: unknown }).tubes)
    ) {
      const tubesRaw = (config as { tubes: unknown[] }).tubes;

      // Legacy format: string[][]
      if (tubesRaw.every((tube) => Array.isArray(tube))) {
        nextTubes = tubesRaw
          .map((tube) => (Array.isArray(tube) ? tube.filter((w) => typeof w === "string") : []))
          .map((tube) => tube as string[]);
      }

      // Standard format: { tubes: [{ wools: number[] }] }
      if (
        tubesRaw.every(
          (tube) =>
            typeof tube === "object" &&
            tube !== null &&
            "wools" in (tube as Record<string, unknown>) &&
            Array.isArray((tube as { wools?: unknown }).wools),
        )
      ) {
        nextTubes = tubesRaw.map((tube) => {
          const wools = (tube as { wools: unknown[] }).wools;
          return wools
            .filter((value) => typeof value === "number")
            .map((value) => editorPalette[(value as number) % editorPalette.length]);
        });
      }
    }

    const nextUndoLimit =
      typeof settings === "object" &&
      settings !== null &&
      (("undoLimit" in settings &&
        typeof (settings as { undoLimit?: unknown }).undoLimit === "number") ||
        ("undo_limit" in settings &&
          typeof (settings as { undo_limit?: unknown }).undo_limit === "number"))
        ? Math.max(
            0,
            Math.floor(
              ((settings as { undoLimit?: number }).undoLimit ??
                (settings as { undo_limit?: number }).undo_limit) as number,
            ),
          )
        : 5;

    const nextCapacity =
      typeof settings === "object" &&
      settings !== null &&
      (("tubeCapacity" in settings &&
        typeof (settings as { tubeCapacity?: unknown }).tubeCapacity === "number") ||
        ("tube_capacity" in settings &&
          typeof (settings as { tube_capacity?: unknown }).tube_capacity === "number"))
        ? Math.max(
            2,
            Math.min(
              8,
              Math.floor(
                ((settings as { tubeCapacity?: number }).tubeCapacity ??
                  (settings as { tube_capacity?: number }).tube_capacity) as number,
              ),
            ),
          )
        : 4;

    set({
      tubes: nextTubes,
      undoLimit: nextUndoLimit,
      tubeCapacity: nextCapacity,
      selectedTube: null,
      history: [],
    });
  },

  setTubes: (tubes) => {
    set({
      tubes: cloneTubes(tubes),
      selectedTube: null,
      history: [],
    });
  },
}));

type BuildPayloadInput = Pick<
  LevelEditorState,
  "tubes" | "undoLimit" | "tubeCapacity" | "levelNumber"
> & {
  difficultyTag: "Easy" | "Medium" | "Hard" | "Expert";
  difficultyScore: number;
};

export function buildLevelPayload(state: BuildPayloadInput) {
  const colorMap = new Map<string, number>();
  let colorCounter = 0;

  const mappedTubes = state.tubes.map((tube) => ({
    wools: tube.map((hexColor) => {
      const existing = colorMap.get(hexColor);
      if (existing !== undefined) {
        return existing;
      }
      const nextId = colorCounter;
      colorMap.set(hexColor, nextId);
      colorCounter += 1;
      return nextId;
    }),
  }));

  return {
    levelNumber: state.levelNumber,
    config: {
      tubes: mappedTubes,
    },
    settings: {
      undoLimit: state.undoLimit,
      tubeCapacity: state.tubeCapacity,
      difficulty: state.difficultyTag,
      heuristicScore: state.difficultyScore,
    },
  };
}
