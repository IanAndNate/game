// some common types shared between client/server
// don't import client deps in here!

export interface Note {
    key: string;
    duration: number;
    time: number;
}

export interface Player {
    id: string;
    name: string;
    isReady?: boolean;
    isCurrent?: boolean;
    isPressed?: boolean;
    isBot: boolean;
}

export interface SongInfo {
    fileName: string,
    songNames: string[],
    enabled: boolean;
    uniqueNotes: number;
    totalNotes: number;
    duration: number; // seconds
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

export interface PlayerNote {
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