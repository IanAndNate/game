var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Midi from '@tonejs/midi';
import { Router } from 'express';
import fileUpload from 'express-fileupload';
import fetch from 'node-fetch';
import express from 'express';
export const songs = [];
const getSongs = (req, res) => {
    res.send(JSON.stringify(songs.map(song => ({
        fileName: song.fileName,
        enabled: song.enabled,
    }))));
};
const parseMidi = (fileName, data) => {
    const midiArray = new Midi.Midi(data);
    const notes = midiArray.tracks.reduce((acc, track) => {
        // if (track.instrument.family !== 'piano') {
        //     return acc;
        // }
        return [
            ...acc,
            ...track.notes,
        ];
    }, []);
    if (notes.length === 0) {
        throw new Error('did not get any notes');
    }
    const uniqueNotes = notes.filter((value, index, self) => {
        return self.findIndex((orig) => orig.name === value.name) === index;
    });
    return { fileName, midiArray, uniqueNotes, music: notes, enabled: true };
};
const addSong = (name, data) => {
    const idx = songs.findIndex(s => s.fileName === name);
    const newSong = parseMidi(name, data);
    if (idx !== -1) {
        songs[idx] = newSong;
    }
    else {
        songs.push(newSong);
    }
};
const addRemoteSong = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(url);
    const blob = yield response.blob();
    const data = yield blob.arrayBuffer();
    addSong(url.split('/').pop(), data);
});
const postSongs = (req, res, next) => {
    try {
        if (!req.files) {
            if (req.query.url) {
                // security risk!!
                const url = req.query.url;
                addRemoteSong(url).then(() => {
                    getSongs(req, res, next);
                    res.end();
                }).catch(() => {
                    res.status(400).send('Failed to add song from URL').end();
                });
                return;
            }
        }
        const song = req.files.song;
        if (!song) {
            throw new Error('no song uploaded, try curl -F "song=@filename.mid"');
        }
        if (Array.isArray(song)) {
            song.forEach(s => addSong(s.name, s.data));
        }
        else {
            addSong(song.name, song.data);
        }
        getSongs(req, res, next);
    }
    catch (err) {
        res.status(400).send(err.message);
    }
};
const deleteSongs = (req, res, next) => {
    songs.length = 0;
    getSongs(req, res, next);
};
const patchSong = (req, res) => {
    const song = songs.find(s => s.fileName === req.params.fileName);
    if (!song) {
        res.status(404).send('No such song').end();
        return;
    }
    song.enabled = req.body.enabled;
    res.status(204).end();
};
export const songsRouter = Router();
songsRouter.get('/songs', getSongs);
songsRouter.post('/songs', fileUpload(), postSongs);
songsRouter.delete('/songs', deleteSongs);
songsRouter.patch('/songs/:fileName', express.json(), patchSong);
