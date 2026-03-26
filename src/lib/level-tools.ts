export type DifficultyTag = "Easy" | "Medium" | "Hard" | "Expert";

export type DifficultyMetrics = {
  colorEntropy: number;
  hiddenBlocks: number;
  estimatedMinimumMoves: number;
  score: number;
  tag: DifficultyTag;
};

type GeneratorOptions = {
  numberOfColors: number;
  numberOfEmptyTubes: number;
  tubeCapacity: number;
  shuffleIterations: number;
  palette: string[];
};

function pickRandomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function cloneTubes(tubes: string[][]): string[][] {
  return tubes.map((tube) => [...tube]);
}

export function generateRandomSolvableLevel(options: GeneratorOptions): string[][] {
  const {
    numberOfColors,
    numberOfEmptyTubes,
    tubeCapacity,
    shuffleIterations,
    palette,
  } = options;

  const colorCount = Math.max(2, Math.min(numberOfColors, palette.length));
  const emptyCount = Math.max(1, numberOfEmptyTubes);
  const capacity = Math.max(2, Math.min(8, tubeCapacity));
  const iterations = Math.max(1, shuffleIterations);

  const chosenColors = palette.slice(0, colorCount);

  // Solved state: each color occupies one full tube, plus empty spare tubes.
  const tubes: string[][] = chosenColors.map((color) => Array.from({ length: capacity }, () => color));
  for (let i = 0; i < emptyCount; i += 1) {
    tubes.push([]);
  }

  for (let i = 0; i < iterations; i += 1) {
    const fromCandidates = tubes
      .map((tube, index) => ({ index, size: tube.length }))
      .filter((item) => item.size > 0);

    if (fromCandidates.length === 0) {
      break;
    }

    const from = fromCandidates[pickRandomInt(fromCandidates.length)].index;

    const toCandidates = tubes
      .map((tube, index) => ({ index, size: tube.length }))
      .filter((item) => item.index !== from && item.size < capacity);

    if (toCandidates.length === 0) {
      break;
    }

    const to = toCandidates[pickRandomInt(toCandidates.length)].index;
    const top = tubes[from].pop();

    if (!top) {
      continue;
    }

    tubes[to].push(top);
  }

  return cloneTubes(tubes);
}

export function evaluateDifficulty(tubes: string[][], tubeCapacity: number): DifficultyMetrics {
  const capacity = Math.max(2, tubeCapacity);

  let entropyTransitions = 0;
  let hiddenBlocks = 0;
  let estimatedMinimumMoves = 0;

  for (const tube of tubes) {
    if (tube.length === 0) {
      continue;
    }

    const topDown = [...tube].reverse();

    for (let i = 1; i < topDown.length; i += 1) {
      if (topDown[i] !== topDown[i - 1]) {
        entropyTransitions += 1;
      }
    }

    const segments = topDown.reduce<string[][]>((acc, color) => {
      const previous = acc[acc.length - 1];
      if (!previous || previous[0] !== color) {
        acc.push([color]);
      } else {
        previous.push(color);
      }
      return acc;
    }, []);

    if (segments.length > 1) {
      hiddenBlocks += segments.length - 1;
    }

    const isSolvedTube = tube.length === capacity && tube.every((color) => color === tube[0]);
    if (!isSolvedTube) {
      estimatedMinimumMoves += Math.max(1, tube.length - 1);
    }
  }

  const normalizedEntropy = entropyTransitions * 6;
  const normalizedHidden = hiddenBlocks * 8;
  const normalizedMoves = estimatedMinimumMoves * 2;
  const score = normalizedEntropy + normalizedHidden + normalizedMoves;

  let tag: DifficultyTag;
  if (score < 35) {
    tag = "Easy";
  } else if (score < 70) {
    tag = "Medium";
  } else if (score < 110) {
    tag = "Hard";
  } else {
    tag = "Expert";
  }

  return {
    colorEntropy: entropyTransitions,
    hiddenBlocks,
    estimatedMinimumMoves,
    score,
    tag,
  };
}
