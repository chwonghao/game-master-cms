export type GameStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type DifficultyTag = "Easy" | "Medium" | "Hard" | "Expert";
export type UserRole = "OWNER" | "ADMIN" | "EDITOR" | "ANALYST";
export type BoosterCurrencyType = "COIN" | "GEM";

export type BoosterRewardItem = {
  boosterId: number;
  quantity: number;
};

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

export type BoosterRecord = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  cost: number;
  currencyType: BoosterCurrencyType;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number | null;
  creator?: {
    id: number;
    email: string;
  };
  updater?: {
    id: number;
    email: string;
  } | null;
};

export type PlayerRecord = {
  id: string;
  username: string;
  email: string;
  providerId?: string | null;
  token?: string | null;
  deviceId?: string | null;
  sessionId?: string | null;
  gameId?: number | null;
  coins: number;
  gems: number;
  currentLevel: number;
  xp: number;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  game?: {
    id: number;
    title: string;
  } | null;
};

export type ShopPackageRecord = {
  id: number;
  name: string;
  description?: string | null;
  packageType: string;
  price: number;
  currency: string;
  coinReward: number;
  gemReward: number;
  boosterRewards: BoosterRewardItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
