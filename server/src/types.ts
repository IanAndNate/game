import { MidiJSON, TrackJSON } from "@tonejs/midi";
import { NoteJSON } from "@tonejs/midi/dist/Note";
import { PlayerNote } from "../../client/src/shared/types";

interface Guess {
  guess: string;
  isCorrect: boolean;
  playerId: string;
}

export interface Song {
  fileName: string;
  midiArray: MidiJSON;
  uniqueNotes: TrackJSON["notes"];
  music: TrackJSON["notes"];
  enabled: boolean;
  songNames: string[];
}

interface Round {
  song: Song;
  guesses: Guess[];
  notesActive: {
    note: string;
    time: number;
  }[];
  startTime?: number;
  speedFactor: number;
  recording: {
    name: string;
    time: number;
    duration: number;
  }[];
}

export interface ServerPlayer {
  id: string;
  name: string;
  notes: PlayerNote[];
  assignedPart: NoteJSON[];
  track?: TrackJSON;
  isReady: boolean;
  isBot: boolean;
  vote?: {
    nextRound: number;
    speedFactor: number;
  };
}

export interface Room {
  roomId: string;
  players: ServerPlayer[];
  rounds: Round[];
  currentRound: number;
  botTimers: NodeJS.Timeout[];
  maxKeys: number; // -1 = unlimited, otherwise add bots until all players have < maxKeys
  botAccuracy: number; // 1 = perfect, 0 = will not play any notes
  splitByTracks: boolean;
}

export interface PlayListSong {
  songNames: string[];
  url: string;
}

export interface PlayListSpec {
  name: string;
  songs: PlayListSong[];
}

export interface PlayList {
  id: string;
  spec: PlayListSpec;
  songs: Song[];
}
