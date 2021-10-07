import express from 'express';
import {createServer} from 'http';
import { Server, Socket } from 'socket.io';
import {v4 as uuidv4} from 'uuid';
import { songsRouter, songs } from './songs.js';
import { KeyPress, Room } from './types';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { RoomInfo, NextRoundProps, RoundInfo, PlayerNote, Player } from './client/shared/types';

const app = express();

app.use(songsRouter);
app.use(express.static(`static`));

const rooms: Room[] = [];

app.get('/new', (_req, res) => {
    const roomId = uuidv4();
    // TODO generate a song list dynamically
    const enabledSongs = songs.filter(s => s.enabled);
    if (enabledSongs.length === 0) {
        res.status(500).send('No songs enabled on server').end();
        return;
    }
    const newRoom: Room = { roomId, players: [], rounds: enabledSongs.map(song => ({
            song,
            guesses: [],
        })),
        currentRound: -1,
        botTimers: [],
    };
    
    rooms.push(newRoom);
    res.send({ roomId: newRoom.roomId });
});

app.get('/rooms', (_req, res) => {    
    res.send(rooms.map(room => getRoomInfo(room)));
});

app.get('*', function (_req, res) {
    res.sendFile('static/index.html', {root: '.'});
});

const index = createServer(app);
const io = new Server(index);

const port = process.env.PORT || 3000;

index.listen(port, () => {
    console.log(`listening on *:${port}`);
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

function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

const getRoomInfo = (room: Room, playerId?: string): RoomInfo => ({
    roomId: room.roomId,
    currentRound: room.currentRound,
    totalRounds: room.rounds.length,
    players: room.players.map(p => ({
        ...p,
        notes: undefined,
        isCurrent: p.id === playerId,
    })),
});

const roomInfoBroadcast = (room: Room) => {
    room.players.filter(p => !p.isBot).forEach((player) => {
        io.to(player.id).emit('room info', getRoomInfo(room, player.id));
    });
}

const runBot = (bot: Player, round: RoundInfo, room: Room, accuracy: number = 0.9) => {
    const { startTime, song, notes, speedFactor } = round;
    const startDelay = startTime - Date.now() + 1000 * speedFactor; // not sure why this 1 sec delay exists
    song.forEach((note) => {
        let noteKey = note.key;
        if (noteKey === '') {
            return;
        }
        if (Math.random() > accuracy) {
            // pick a different key
            noteKey = notes[getRandomNumber(0, notes.length - 1)].key;
            if (noteKey === note.key) {
                // just skip the note entirely
                return;
            }
        }
        const n = notes.find(playerNote => playerNote.key === noteKey);
        if (!n) {
            return;
        }
        // add some variation to start/end times
        const noteTime = note.time + Math.random() * (1 - accuracy) - accuracy;
        const noteDuration = note.duration * (accuracy + 2 * Math.random() * (1 - accuracy))
        if (noteDuration <= 0) {
            return;
        }

        const startNote = setTimeout(() => {
            const keyPress: KeyPress = {
                note: n.note,
                playerId: bot.id,
            };
            io.to(room.roomId).emit('keydown broadcast', keyPress);
        }, startDelay + noteTime * 1000 * speedFactor);
        const endNote = setTimeout(() => {
            const keyPress: KeyPress = {
                note: n.note,
                playerId: bot.id,
            };
            io.to(room.roomId).emit('keyup broadcast', keyPress);
        }, startDelay + (noteTime + noteDuration) * 1000 * speedFactor);
        room.botTimers.push(startNote);
        room.botTimers.push(endNote);
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
            if (room.players.filter(p => !p.isBot).length === 0) {
                // clear all bot timers when closing a room
                room.botTimers.forEach((t) => clearTimeout(t));
                rooms.splice(roomIndex, 1);
            } else {
                roomInfoBroadcast(room);
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
                isReady: false,
                isBot: false,
            });
            roomInfoBroadcast(room);
        } else {
            socket.emit('abort');
        }
    });

    socket.on('add bot', () => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        if (!room) {
            return;
        }
        room.players.push({
            id: uuidv4(),
            notes: [],
            name: `${uniqueNamesGenerator({
                dictionaries: [adjectives, animals],
                separator: ' ',
                style: 'capital',
            })}-bot`,
            isReady: true,
            isBot: true,
        });
        roomInfoBroadcast(room);
    });

    socket.on('request abort round', () => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        if (!room) {
            return;
        }

        room.botTimers.forEach(clearTimeout);
        room.botTimers = [];
        io.to(room.roomId).emit('abort round');
    });

    socket.on('request start round', ({ speedFactor, round }: NextRoundProps) => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        if (room) {
            const { players } = room;
            if (room.currentRound + 1 !== round || round >= room.rounds.length) {
                return; // already starting?
            }
            const player = room.players.find((player) => player.id === socket.id);
            player.isReady = true;
            if (!room.players.every(p => p.isReady)) {
                roomInfoBroadcast(room);
                return; // not everyone is ready yet, but broadcast the updated readiness
            }
            // start a new round, clear stuff from previous round
            room.currentRound = round;
            room.players.forEach(p => p.notes = []);
            room.botTimers.forEach(clearTimeout);
            room.botTimers = [];

            const song = room.rounds[room.currentRound].song;
            const { uniqueNotes } = song;
            const playerNumber = players.length;
            const shuffledPlayers = shuffle([...players]);
            uniqueNotes.forEach((note, i) => {
                // 0, 1, 2, 3, 4, 5
                // 1
                const insertIndex = i % playerNumber;
                shuffledPlayers[insertIndex].notes = shuffledPlayers[insertIndex].notes || [];
                shuffledPlayers[insertIndex].notes.push({
                    note: note.name,
                    key: KEYBOARD_KEYS[shuffledPlayers[insertIndex].notes.length]
                })
            });
            const startTime = Date.now() + 10000;
            const totalDuration = Math.max(...song.music.map(note => note.time + note.duration)) * 1000;
           
            players.forEach((player) => {
                const roundInfo: RoundInfo = {
                    speedFactor,
                    notes: player.notes,
                    song: song.music.map(({name, time, duration}) => {
                        const matched = player.notes.find((mapped) => mapped.note === name);
                        return {key: matched && matched.key || '', time, duration }
                    }),
                    startTime,
                    totalDuration,
                    round: room.currentRound,
                }
                if (player.isBot) {
                    runBot(player, roundInfo, room, 1.0);
                } else {
                    io.to(player.id).emit('start round', roundInfo);
                    // reset players readiness (for guessing)
                    // XXX the problem with this is if a player disconnects, it will broadcast this to all other players...
                    player.isReady = false;
                }
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

    socket.on("guess", (guess, cb) => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);
        if (!room || room.currentRound < 0) {
            return;
        }
        const player = room.players.find((player) => player.id === socket.id);
        // just ignore all non-alphanumeric characters
        const sanitise = (name: string): string => name.toLowerCase().replace(/[^0-9a-z]/g, '');
        const isCorrect = room.rounds[room.currentRound].song.songNames.map(sanitise).includes(sanitise(guess));
        room.rounds[room.currentRound].guesses.push({
            playerId: player.id,
            guess,
            isCorrect,
        });
        cb(isCorrect);
    });
});