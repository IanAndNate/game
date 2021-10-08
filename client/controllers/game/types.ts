import { Socket } from 'socket.io-client';
import { Sampler } from 'tone';
import { PlayerNote, Note, Player } from '../../shared/types';

export enum GameStatus {
    Disconnected = 'disconnected',
    Lobby = 'lobby',
    Starting = 'starting',
    Running = 'running',
    Guessing = 'guessing',
    Spectating = 'spectating',
}
interface Guess {
    attempt: string;
    isCorrect: boolean;
}

export interface State {
    roomId?: string;
    socket?: Socket;
    piece?: { notes: PlayerNote[], song: Note[], startTime: number, totalDuration: number, speedFactor: number };
    status: GameStatus;
    synth?: Sampler;
    latency?: number;
    timeDiff?: { diff: number, measures: number[] };
    keysDown: Set<string>;
    players: Player[];
    toneStarted: boolean;
    timeTillLaunch?: number;
    timers: Function[];
    currentRound?: number;
    totalRounds?: number;
    guesses: Guess[];
    escapeCount: number;
}
