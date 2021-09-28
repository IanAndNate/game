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

let players = [];

const pieces = [
    {
        notes: [
            {note: "E4", start: 0, beats: 1},
            {note: "D4", start: 1, beats: 1},
            {note: "C4", start: 2, beats: 1},
            {note: "D4", start: 3, beats: 1},
            {note: "E4", start: 4, beats: 1},
            {note: "E4", start: 5, beats: 1},
            {note: "E4", start: 6, beats: 2},
            {note: "D4", start: 8, beats: 1},
            {note: "D4", start: 9, beats: 1},
            {note: "D4", start: 10, beats: 2},
            {note: "E4", start: 12, beats: 1},
            {note: "G4", start: 13, beats: 1},
            {note: "G4", start: 14, beats: 2},
            {note: "E4", start: 16, beats: 1},
            {note: "D4", start: 17, beats: 1},
            {note: "C4", start: 18, beats: 1},
            {note: "D4", start: 19, beats: 1},
            {note: "E4", start: 20, beats: 1},
            {note: "E4", start: 21, beats: 1},
            {note: "E4", start: 22, beats: 1},
            {note: "E4", start: 23, beats: 1},
            {note: "D4", start: 24, beats: 1},
            {note: "D4", start: 25, beats: 1},
            {note: "E4", start: 26, beats: 1},
            {note: "D4", start: 27, beats: 1},
            {note: "C4", start: 28, beats: 4},
        ],
        title: "Mary had a little lamb"
    }
];

readFile("chopin-ballade1.mid", 'base64', function (err, data) {
    // Parse the obtainer base64 string ...
    var midiArray = midiParser.parse(data);
    // done!
    console.log(midiArray);
    midiArray.track.forEach((track) => {
        track.event.filter((e) => {
            return e.type === 9 || e.type === 8
        }).forEach((e) => {
            console.log(e);
        });
    });
});

const KEYBOARD_KEYS = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm'];
let remapped = [];

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

const uniqueNotes = pieces[0].notes.filter((value, index, self) => {
    return self.findIndex((orig) => orig.note === value.note) === index;
});

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

    socket.on('disconnect', () => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);
        if (room) {
            room.players = room.players || [];
            room.players = room.players.filter((id) => id === socket.id);
        }
    });

    socket.on('join room', (roomId) => {
        const room = rooms.find(({ roomId: id }) => id === roomId);
        if (room) {
            socket.join(roomId);
            room.players = room.players || [];
            room.players.push(socket.id);
        }
    });

    socket.on('request start game', () => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        let numbersArray = createArrayOfNumber(0, KEYBOARD_KEYS.length - 1);
        if (room) {
            room.remapped = uniqueNotes.map((note) => {
                let randomNumber;
                let randomIndex;
                while (typeof randomNumber === 'undefined') {
                    randomIndex = getRandomNumber(0, KEYBOARD_KEYS.length - 1);
                    randomNumber = numbersArray[randomIndex];
                }
                if (randomIndex) {
                    numbersArray.splice(randomIndex, 1);
                }
                return {
                    note: note.note,
                    key: KEYBOARD_KEYS[randomNumber]
                }
            });
            io.to(roomId).emit('start game', pieces[0].notes.map(({note}) => {
                return {key: room.remapped.find((mapped) => mapped.note === note).key}
            }));
        }
    });

    socket.on('keydown', (msg) => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        const mapped = room.remapped && room.remapped.find(({key}) => key === msg);
        if (mapped) {
            io.to(roomId).emit('keydown broadcast', mapped.note);
        }
    });

    socket.on('keyup', (msg) => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        const mapped = room.remapped && room.remapped.find(({key}) => key === msg);
        if (mapped) {
            io.to(roomId).emit('keyup broadcast', mapped.note);
        }
    });
});
