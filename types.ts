import { MidiJSON } from '@tonejs/midi';
import { TrackJSON } from '@tonejs/midi';

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
    players: Player[];
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

export interface Player {
    id: string;
    name: string;
    notes: PlayerNote[];
    isReady: boolean;
}

export interface PlayerNote {
    note: string;
    key: string;
}

export interface KeyPress {
    playerId: string;
    note: string;
}