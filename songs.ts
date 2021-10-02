import Midi from '@tonejs/midi';
import { Router } from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import { Song } from './types';
import { RequestHandler } from 'express-serve-static-core';

export const songs: Song[] = [];

const getSongs: RequestHandler = (req, res) => {
    res.send(JSON.stringify(songs.map(song => song.fileName)));
}

const parseMidi = (fileName: string, data: Buffer) => {
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
    return { fileName, midiArray, uniqueNotes, music: notes, };
};

const postSongs: RequestHandler = (req, res) => {
    try {
        // TODO: handle UploadedFile[]
        // @ts-ignore
        const song: UploadedFile = req.files.song;
        if (!song) {
            throw new Error('no song uploaded, try curl -F "song=@filename.mid"');
        }
        const idx = songs.findIndex(s => s.fileName === song.name);
        const newSong = parseMidi(song.name, song.data);
        if (idx !== -1) {
            songs[idx] = newSong;
        } else {
            songs.push(newSong);
        }
        res.send(JSON.stringify(songs.map(song => song.fileName)));
    } catch (err) {
        res.status(400).send(err.message);
    }
};

const deleteSongs: RequestHandler = (req, res) => {
    songs.length = 0;
    res.send(JSON.stringify(songs.map(song => song.fileName)));
}

export const songsRouter = Router();

songsRouter.use(fileUpload());
songsRouter.get('/songs', getSongs);
songsRouter.post('/songs', postSongs);
songsRouter.delete('/songs', deleteSongs);
