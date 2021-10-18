import Midi from "@tonejs/midi";
import express, { Router, RequestHandler } from "express";
import fileUpload from "express-fileupload";
import fetch from "node-fetch";
import fs from "fs";
import { Song } from "./types";
import { SongInfo } from "../../client/src/shared/types";

export const songs: Song[] = [];

interface SongDef {
  fileName: string;
  songNames: string[];
}

const EXCLUDED_MIDI_FAMILIES = [
  "drums",
  "percussive",
  "synth effects",
  "synth pad",
  "sound effects",
];
export const parseMidi = (fileName: string, data: ArrayBuffer): Song => {
  const midiArray = new Midi.Midi(data);
  const notes = midiArray.tracks.reduce((acc, track) => {
    if (EXCLUDED_MIDI_FAMILIES.includes(track.instrument.family)) {
      return acc;
    }
    return [...acc, ...track.notes];
  }, []);
  if (notes.length === 0) {
    throw new Error("did not get any notes");
  }
  const uniqueNotes = notes.filter((value, index, self) => {
    return self.findIndex((orig) => orig.name === value.name) === index;
  });
  return {
    fileName,
    midiArray,
    uniqueNotes,
    music: notes,
    enabled: true,
    songNames: [],
  };
};

export const loadSong = async (urlOrFile: string): Promise<Song> => {
  if (urlOrFile.startsWith("http")) {
    const response = await fetch(urlOrFile);
    const blob = await response.blob();
    const data = await blob.arrayBuffer();
    return parseMidi(urlOrFile, data);
  }
  const data = fs.readFileSync(urlOrFile);
  return parseMidi(urlOrFile, data);
};

export const parseMidiUrls = async (urls: string[]): Promise<Song[]> => {
  const fetchOne = async (url: string): Promise<Song | null> => {
    try {
      return await parseMidiUrl(url);
    } catch (err) {
      console.error("Failed to fetch MIDI", url, err);
      return null;
    }
  };
  return (await Promise.all(urls.map(fetchOne))).filter((s) => s !== null);
};

const INITIAL_SONGS: SongDef[] = [
  // {
  //   fileName: "amazgrac04.mid",
  //   songNames: ["amazing grace"],
  // },
  // {
  //   fileName: "tetris.mid",
  //   songNames: ["tetris", "korobeiniki"],
  // },
  // {
  //   fileName: "pirates.mid",
  //   songNames: ["pirates of the carribean", "hes a pirate"],
  // },
  {
    fileName: "HeartAndSoul.mid",
    songNames: ["heart and soul"],
  },
  {
    fileName: "zelda.mid",
    songNames: ["zelda", "legend of zelda", "zelda overworld"],
  },
  {
    fileName: "tetris_2hands.mid",
    songNames: ["tetris"],
  },
];

const initSongs = () => {
  fs.readdirSync("./midi").forEach(async (file) => {
    if (file.endsWith(".mid")) {
      const song = await loadSong(`./midi/${file}`);
      const songDef = INITIAL_SONGS.find((s) => s.fileName === file);
      songs.push({
        ...song,
        enabled: songDef !== undefined,
        songNames: songDef?.songNames || [],
      });
    }
  });
};

export const getSongInfo = (song: Song): SongInfo => ({
  fileName: song.fileName,
  songNames: song.songNames,
  enabled: song.enabled,
  uniqueNotes: song.uniqueNotes.length,
  totalNotes: song.music.length,
  duration: Math.max(...song.music.map((n) => n.time + n.duration)),
});

const getSongs: RequestHandler = (_req, res) => {
  res.send(JSON.stringify(songs.map<SongInfo>(getSongInfo)));
};

const addSong = (song: Song) => {
  const idx = songs.findIndex((s) => s.fileName === song.fileName);
  if (idx !== -1) {
    songs[idx] = song;
  } else {
    songs.push(song);
  }
};

const postSongs: RequestHandler = (req, res, next) => {
  try {
    if (!req.files) {
      if (req.query.url) {
        // security risk!!
        const url = req.query.url as string;
        loadSong(url)
          .then((song) => {
            addSong(song);
            getSongs(req, res, next);
            res.end();
          })
          .catch(() => {
            res.status(400).send("Failed to add song from URL").end();
          });
        return;
      }
    }
    const { song } = req.files;
    if (!song) {
      throw new Error('no song uploaded, try curl -F "song=@filename.mid"');
    }
    if (Array.isArray(song)) {
      song.forEach((s) => addSong(parseMidi(s.name, s.data)));
    } else {
      addSong(parseMidi(song.name, song.data));
    }
    getSongs(req, res, next);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const deleteSongs: RequestHandler = (req, res, next) => {
  songs.length = 0;
  getSongs(req, res, next);
};

const patchSong: RequestHandler = (req, res) => {
  const song = songs.find((s) => s.fileName === req.params.fileName);
  if (!song) {
    res.status(404).send("No such song").end();
    return;
  }
  if (req.body.enabled !== undefined) {
    song.enabled = req.body.enabled;
  }
  if (Array.isArray(req.body.songNames)) {
    song.songNames = req.body.songNames;
  }
  res.status(204).end();
};

initSongs();

export const songsRouter = Router();

songsRouter.get("/songs", getSongs);
songsRouter.post("/songs", fileUpload(), postSongs);
songsRouter.delete("/songs", deleteSongs);
songsRouter.patch("/songs/:fileName", express.json(), patchSong);
