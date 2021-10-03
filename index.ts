import express from 'express';
import {createServer} from 'http';
import { Server, Socket } from 'socket.io';
import {readFile} from 'fs';
import {v4 as uuidv4} from 'uuid';
import { songsRouter, songs } from './songs.js';
import { MidiJSON } from '@tonejs/midi';
import { KeyPress, PlayerNote, Room } from './types';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

const app = express();

app.use(songsRouter);
app.use(express.static(`static`));

const rooms: Room[] = [];

app.get('/new', (req, res) => {
    const roomId = uuidv4();
    const newRoom: Room = { roomId, players: [], song: null }
    rooms.push(newRoom);
    res.send({roomId: newRoom.roomId});
});

app.get('/rooms', (_req, res) => {
    res.send(rooms.map(room => ({
        ...room,
        players: room.players.map(player => ({
            ...player,
            notes: undefined,
        })),
        song: undefined,
        started: !!room.song,
    })));
});

app.get('*', function (req, res) {
    res.sendFile('static/index.html', {root: '.'});
});

const index = createServer(app);
const io = new Server(index);

const port = process.env.PORT || 3000;

index.listen(port, () => {
    console.log(`listening on *:${port}`);
});

readFile("midi/2289444_1.json", function (err, data) {
    // Parse the obtainer base64 string ...
    const midiArray: MidiJSON = JSON.parse(data.toString());
    const notes = midiArray.tracks[0].notes;

    const uniqueNotes = notes.filter((value, index, self) => {
        return self.findIndex((orig) => orig.name === value.name) === index;
    });

    songs.push({ fileName: '2289444_1.mid', midiArray, uniqueNotes, music: notes, enabled: true });
});

readFile("midi/pirates.json", function (err, data) {
    // Parse the obtainer base64 string ...
    const midiArray: MidiJSON = JSON.parse(data.toString());
    const notes = midiArray.tracks[0].notes

    const uniqueNotes = notes.filter((value, index, self) => {
        return self.findIndex((orig) => orig.name === value.name) === index;
    });

    songs.push({ fileName: 'pirates.mid', midiArray, uniqueNotes, music: notes, enabled: true });
});

readFile("midi/amazgrac04.json", function (err, data) {
    // Parse the obtainer base64 string ...
    const midiArray: MidiJSON = JSON.parse(data.toString());
    const notes = midiArray.tracks[0].notes

    const uniqueNotes = notes.filter((value, index, self) => {
        return self.findIndex((orig) => orig.name === value.name) === index;
    });

    songs.unshift({ fileName: 'amazgrac04.mid', midiArray, uniqueNotes, music: notes, enabled: true });
});

readFile("midi/tetris.json", function (err, data) {
    // Parse the obtainer base64 string ...
    const midiArray: MidiJSON = JSON.parse(data.toString());
    const notes = midiArray.tracks[0].notes

    const uniqueNotes = notes.filter((value, index, self) => {
        return self.findIndex((orig) => orig.name === value.name) === index;
    });

    songs.push({ fileName: 'tetris.mid', midiArray, uniqueNotes, music: notes, enabled: true });
});

const KEYBOARD_KEYS = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ',', '.', '/'];
const SCALE = "CDEFGAB";
const LOBBY_NOTES: PlayerNote[] = KEYBOARD_KEYS.map((key, idx) => {
    const octave = Math.floor(idx / SCALE.length) + 3;
    const note = SCALE.split('')[idx % SCALE.length];
    return {
        key,
        note: `${note}${octave}`,
    };
});

function getRandomNumber(min: number, max: number) {
    let totalEle = max - min + 1;
    let result = Math.floor(Math.random() * totalEle) + min;
    return result;
}

function createArrayOfNumber(start: number, end: number) {
    let myArray = [];
    for (let i = start; i <= end; i++) {
        myArray.push(i);
    }
    return myArray;
}

const getRoomId = (socket: Socket) => {
    const entries = socket.rooms.values();
    if (entries) {
        let room = entries.next();
        while (room && room.value && room.value === socket.id) {
            room = entries.next()
        }
        return room && room.value;
    }
}

const playersBroadcast = (room: Room) => {
    room.players.forEach((player) => {
        io.to(player.id).emit('players', room.players.map(p => ({
            ...p,
            isCurrent: p.id === player.id,
            notes: undefined,
        })));
    });
}

io.on('connection', (socket) => {

    socket.on("disconnecting", () => {
        const roomId = getRoomId(socket);
        const roomIndex = rooms.findIndex(({ roomId: id }) => id === roomId);
        const room = rooms[roomIndex];
        if (room) {
            room.players = room.players || [];
            room.players = room.players.filter(({ id }) => id !== socket.id);
            if (room.players.length === 0) {
                rooms.splice(roomIndex, 1);
            } else {
                playersBroadcast(room);
            }
        }
    });

    socket.on('disconnect', () => {

    });

    socket.on('join room', (roomId) => {
        const room = rooms.find(({ roomId: id }) => id === roomId);
        if (room) {
            socket.join(roomId);
            room.players = room.players || [];
            room.players.push({
                id: socket.id,
                notes: [],
                name: uniqueNamesGenerator({
                    dictionaries: [adjectives, animals],
                    separator: ' ',
                    style: 'capital',
                }),
            });
            playersBroadcast(room);
        } else {
            socket.emit('abort');
        }
    });

    socket.on('request start game', () => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        if (room) {
            const { players } = room;
            const enabledSongs = songs.filter(s => s.enabled);
            if (enabledSongs.length === 0) {
                players.forEach((player) => {
                    io.to(player.id).emit('alert', { message: 'No songs enabled on server :(' });
                });
                return;
            }
            const song = enabledSongs[getRandomNumber(0, enabledSongs.length - 1)];
            // console.log('starting game with', song.fileName);
            const { uniqueNotes } = song;
            room.song = song;
            const playerNumber = players.length;
            uniqueNotes.forEach((note, i) => {
                // 0, 1, 2, 3, 4, 5
                // 1
                const insertIndex = i % playerNumber;
                players[insertIndex].notes = players[insertIndex].notes || [];
                players[insertIndex].notes.push({
                    note: note.name,
                    key: KEYBOARD_KEYS[players[insertIndex].notes.length]
                })
            });
            const startTime = Date.now() + 10000;
            players.forEach((player) => {
                io.to(player.id).emit('start game', { notes: player.notes, song: song.music.map(({name, time, duration}) => {
                    const matched = player.notes.find((mapped) => mapped.note === name);
                    return {key: matched && matched.key || '', time, duration }
                }), startTime });
            });
        }
    });

    const handleKeyEvent = (msg: string, event: 'down' | 'up') => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);
        if (room) {
            const player = room.players.find((player) => player.id === socket.id);
            if (player) {
                const notes = player.notes.length > 0 ? player.notes : LOBBY_NOTES; // give people something to do while waiting
                const mapped = notes && notes.find(({key}) => key === msg);
                if (mapped) {
                    const keypress: KeyPress = {
                        playerId: player.id,
                        note: mapped.note,
                    }
                    io.to(roomId).emit(`key${event} broadcast`, keypress);
                }
            }
        }
    };

    socket.on('keydown', (msg) => handleKeyEvent(msg, 'down'));
    socket.on('keyup', (msg) => handleKeyEvent(msg, 'up'));

    socket.on("ping", (cb) => {
        if (typeof cb === "function") {
            cb(Date.now());
        }
    });
});