import { Socket } from 'socket.io-client';
import { Sampler } from 'tone';

interface Note {
    key: string;
    duration: number;
    time: number;
}

export enum GameStatus {
    Disconnected = 'disconnected',
    Lobby = 'lobby',
    Starting = 'starting',
    Running = 'running',
    Guessing = 'guessing',
}

export interface Player {
    id: string;
    name: string;
    isReady?: boolean;
    isCurrent?: boolean;
    isPressed?: boolean;
}

export interface RoomInfo {
    roomId: string;
    players: Player[];
    currentRound: number;
    totalRounds: number;
}

export interface NextRoundProps {
    round: number;
    speedFactor: number;
}

interface PlayerNote {
    key: string;
    note: string; // we should not send this to the client, really
}
export interface RoundInfo {
    round: number;
    speedFactor: number;
    startTime: number;
    totalDuration: number;
    song: Note[];
    notes: PlayerNote[];
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
}
