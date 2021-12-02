import { Socket } from "socket.io-client";
import { Sampler } from "tone";
import { PlayerNote, Note, Player, GameOverInfo } from "../../shared/types";

export enum GameStatus {
  Disconnected = "disconnected",
  Lobby = "lobby",
  Starting = "starting",
  Running = "running",
  Guessing = "guessing",
  Spectating = "spectating",
  GameOver = "gameover",
}

export enum GameMode {
  Standard = "standard",
  BitMidi = "bitmidi",
  BitMidi5 = "bitmidi5",
  PlayList = "playlist",
}

interface Guess {
  attempt: string;
  isCorrect: boolean;
}

export interface State {
  roomId?: string;
  socket?: Socket;
  piece?: {
    notes: PlayerNote[];
    song: Note[];
    startTime: number;
    totalDuration: number;
    speedFactor: number;
  };
  status: GameStatus;
  synth?: Sampler;
  latency?: number;
  timeDiff?: { diff: number; measures: number[] };
  keysDown: Set<string>;
  players: Player[];
  toneStarted: boolean;
  timeTillLaunch?: number;
  timers: (() => void)[];
  currentRound?: number;
  totalRounds?: number;
  guesses: Guess[];
  escapeCount: number;
  gameOverInfo?: GameOverInfo;
  instructions: string;
  maxGuesses: number;
}

export interface NewGameOptions {
  mode: GameMode;
  maxKeys?: number;
  botAccuracy?: number;
  playlist?: string;
  splitByTracks?: boolean;
}
