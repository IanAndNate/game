import Midi from '@tonejs/midi';
import { Router } from 'express';
import fileUpload from 'express-fileupload';
import fetch from 'node-fetch';
import { Song } from './types';
import { RequestHandler } from 'express-serve-static-core';
import express from 'express';

export const songs: Song[] = [];

const getSongs: RequestHandler = (req, res) => {
    res.send(JSON.stringify(songs.map(song => ({
        fileName: song.fileName,
        enabled: song.enabled,
    }))));
}

const parseMidi = (fileName: string, data: ArrayBuffer) => {
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

const addSong = (name: string, data: ArrayBuffer) => {
    const idx = songs.findIndex(s => s.fileName === name);
    const newSong = parseMidi(name, data);
    if (idx !== -1) {
        songs[idx] = newSong;
    } else {
        songs.push(newSong);
    }
}

const addRemoteSong = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob()
    const data = await blob.arrayBuffer();
    addSong(url.split('/').pop(), data);
}

const postSongs: RequestHandler = (req, res, next) => {
    try {
        if (!req.files) {
            if (req.query.url) {
                // security risk!!
                const url = req.query.url as string;
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
        } else {
            addSong(song.name, song.data);
        }
        getSongs(req, res, next);
    } catch (err) {
        res.status(400).send(err.message);
    }
};

const deleteSongs: RequestHandler = (req, res, next) => {
    songs.length = 0;
    getSongs(req, res, next);
}

const patchSong: RequestHandler = (req, res) => {
    const song = songs.find(s => s.fileName === req.params.fileName);
    if (!song) {
        res.status(404).send('No such song').end();
        return;
    }
    song.enabled = req.body.enabled;
    res.status(204).end();
}

export const songsRouter = Router();

songsRouter.get('/songs', getSongs);
songsRouter.post('/songs', fileUpload(), postSongs);
songsRouter.delete('/songs', deleteSongs);
songsRouter.patch('/songs/:fileName', express.json(), patchSong);
