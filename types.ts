import { MidiJSON } from '@tonejs/midi';
import { TrackJSON } from '@tonejs/midi';

export interface Room {
    roomId: string;
    players: Player[];
    song: Song;
}

export interface Song {
    fileName: string;
    midiArray: MidiJSON;
    uniqueNotes: TrackJSON['notes'];
    music: TrackJSON['notes'];
}

export interface Player {
    id: string;
    name: string;
    notes: PlayerNote[]
}

export interface PlayerNote {
    note: string;
    key: string;
}