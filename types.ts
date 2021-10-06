import { MidiJSON } from '@tonejs/midi';
import { TrackJSON } from '@tonejs/midi';
import { PlayerNote } from './client/shared/types';

interface Guess {
    guess: string;
    isCorrect: boolean;
    playerId: string;
}
interface Round {
    song: Song;
    guesses: Guess[];
}
export interface Room {
    roomId: string;
    players: ServerPlayer[];
    rounds: Round[];
    currentRound: number;
}

export interface Song {
    fileName: string;
    midiArray: MidiJSON;
    uniqueNotes: TrackJSON['notes'];
    music: TrackJSON['notes'];
    enabled: boolean;
    songNames: string[];
}

export interface ServerPlayer {
    id: string;
    name: string;
    notes: PlayerNote[];
    isReady: boolean;
}

export interface KeyPress {
    playerId: string;
    note: string;
}