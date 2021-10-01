import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import midiParser from 'midi-parser-js';
import {readFile} from 'fs';
import {v4 as uuidv4} from 'uuid';

const app = express();

app.use(express.static(`static`));
const rooms = [];
app.get('/new', (req, res) => {
    const roomId = uuidv4();
    const newRoom = {roomId}
    rooms.push(newRoom);
    res.send({roomId: newRoom.roomId});
})

app.get('*', function (req, res) {
    res.sendFile('static/index.html', {root: '.'});
});

const index = createServer(app);
const io = new Server(index);

const port = process.env.PORT || 3000;

index.listen(port, () => {
    console.log(`listening on *:${port}`);
});

const songs = [];

readFile("midi/pirates.json", function (err, data) {
    // Parse the obtainer base64 string ...
    const midiArray = JSON.parse(data.toString());
    const notes = midiArray.tracks[0].notes

    const uniqueNotes = notes.filter((value, index, self) => {
        return self.findIndex((orig) => orig.name === value.name) === index;
    });

    songs.push({ midiArray, uniqueNotes, music: notes });
});

readFile("midi/amazgrac04.json", function (err, data) {
    // Parse the obtainer base64 string ...
    const midiArray = JSON.parse(data.toString());
    const notes = midiArray.tracks[0].notes

    const uniqueNotes = notes.filter((value, index, self) => {
        return self.findIndex((orig) => orig.name === value.name) === index;
    });

    songs.push({ midiArray, uniqueNotes, music: notes });
});

readFile("midi/2289444_1.json", function (err, data) {
    // Parse the obtainer base64 string ...
    const midiArray = JSON.parse(data.toString());
    const notes = midiArray.tracks[0].notes

    const uniqueNotes = notes.filter((value, index, self) => {
        return self.findIndex((orig) => orig.name === value.name) === index;
    });

    songs.push({ midiArray, uniqueNotes, music: notes });
});

const KEYBOARD_KEYS = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ',', '.', '/'];

function getRandomNumber(min, max) {
    let totalEle = max - min + 1;
    let result = Math.floor(Math.random() * totalEle) + min;
    return result;
}

function createArrayOfNumber(start, end) {
    let myArray = [];
    for (let i = start; i <= end; i++) {
        myArray.push(i);
    }
    return myArray;
}

const getRoomId = (socket) => {
    const entries = socket.rooms.values();
    if (entries) {
        let room = entries.next();
        while (room && room.value && room.value === socket.id) {
            room = entries.next()
        }
        return room && room.value;
    }
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
            room.players.push({ id: socket.id });
        }
    });

    socket.on('request start game', () => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        if (room) {
            const song = songs[0];
            const { uniqueNotes } = song;
            const { players } = room;
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
                io.to(player.id).emit('start game', { song: song.music.map(({name, time, duration}) => {
                    const matched = player.notes.find((mapped) => mapped.note === name);
                    return {key: matched && matched.key || '', time, duration }
                }), startTime });
            });
        }
    });

    socket.on('keydown', (msg) => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);
        if (room) {
            const player = room.players.find((player) => player.id === socket.id);
            if (player) {
                const mapped = player.notes && player.notes.find(({key}) => key === msg);
                if (mapped) {
                    io.to(roomId).emit('keydown broadcast', mapped.note);
                }
            }
        }
    });

    socket.on('keyup', (msg) => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);
        if (room) {
            const player = room.players.find((player) => player.id === socket.id);

            if (player) {
                const mapped = player.notes && player.notes.find(({key}) => key === msg);
                if (mapped) {
                    io.to(roomId).emit('keyup broadcast', mapped.note);
                }
            }
        }
    });
});
