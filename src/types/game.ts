export type GameStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type DifficultyTag = "Easy" | "Medium" | "Hard" | "Expert";
export type UserRole = "OWNER" | "ADMIN" | "EDITOR" | "ANALYST";

export type LevelConfig = {
  tubes: Array<{
    wools: number[];
  }>;
};

export type LevelSettings = {
  undoLimit: number;
  tubeCapacity: number;
  difficulty: DifficultyTag;
  heuristicScore: number;
};

export type LevelRecord = {
  id: number;
  gameId: number;
  levelNumber: number;
  config: LevelConfig;
  settings: LevelSettings;
  createdAt: string;
  updatedAt: string;
};

export type UserRecord = {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type GameRecord = {
  id: number;
  title: string;
  genre: string;
  status: GameStatus;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    levels: number;
    analytics: number;
  };
};
