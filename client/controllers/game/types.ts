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
    Loading = 'loading',
    Starting = 'starting',
    Running = 'running',
}

export interface Player {
    id: string;
    name: string;
}

export interface State {
    roomId?: string;
    socket?: Socket;
    piece?: Note[];
    status: GameStatus;
    synth?: Sampler;
    latency?: number;
    timeDiff?: number;
    keysDown: Set<string>;
    players: Player[];
}
