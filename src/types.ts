export type GameMode = 'Singles' | 'Doubles';
export type MatchFormat = 'Single Game' | 'Best of 3';
export type CourtSide = 'R' | 'L';
export type ColorTheme = 'coral' | 'green';

export interface GameScore {
  scoreA: number;
  scoreB: number;
  winner: number; // -1 if not finished, 0 for side A, 1 for side B
}

export interface DoublesPositions {
  // Player index 0, 1 (Team A), 2, 3 (Team B)
  // Maps player index to their current court ('R' or 'L')
  courtPositions: Record<number, CourtSide>;
}

export interface MatchState {
  id: string;
  date: string;
  mode: GameMode;
  format: MatchFormat;
  winScore: number;
  plus2: boolean;
  players: [string, string, string, string]; // 0,1: Team A, 2,3: Team B
  teamNames?: [string, string]; // Optional custom names for Team A and Team B in Doubles
  games: GameScore[];
  gamesWonA: number;
  gamesWonB: number;
  currentGame: number;
  servingSide: number; // 0 for Team A, 1 for Team B
  currentServer: number; // 0..3 (player index)
  currentReceiver: number; // 0..3 (player index)
  courtPositions: Record<number, CourtSide>;
  initialServer: number;
  initialReceiver: number;
  winner: number;
  sidesSwitched: boolean;
  groupTags: string[];
  isDraft?: boolean;
}

export interface MatchGroup {
  id: string;
  name: string;
  matches: string[];
}
