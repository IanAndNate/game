import express from 'express';
import {createServer} from 'http';
import { Server, Socket } from 'socket.io';
import {v4 as uuidv4} from 'uuid';
import { songsRouter, songs } from './songs.js';
import { getRandomBitMidiSong } from './bitmidi.js';
import { KeyPress, Room } from './types';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { RoomInfo, NextRoundProps, RoundInfo, PlayerNote, Player, GameOverInfo, GameOverPlayerRoundInfo } from './client/shared/types';
import Midi from '@tonejs/midi';

const app = express();

app.use(songsRouter);
app.use(express.static(`static`));

const rooms: Room[] = [];

app.get('/new', async (req, res) => {
    const roomId = uuidv4();
    let enabledSongs = songs.filter(s => s.enabled);
    if (req.query.bitmidi) {
        const numSongs = parseInt(req.query.bitmidi as string);
        enabledSongs = await Promise.all([...Array(numSongs)].map(_ => getRandomBitMidiSong(500)));
    }
    if (enabledSongs.length === 0) {
        res.status(500).send('No songs enabled on server').end();
        return;
    }
    const newRoom: Room = { roomId, players: [], rounds: enabledSongs.map(song => ({
            song,
            guesses: [],
            notesActive: [],
            recording: [],
            speedFactor: 1,
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

app.get('/game/:roomId/:roundIdx.mid', (req, res) => {
    const { roomId, roundIdx } = req.params;
    const room = rooms.find(r => r.roomId === roomId);
    if (!room) {
        res.status(404).send('no such room').end();
        return;
    }
    const round = room.rounds[parseInt(roundIdx)];
    if (!round || round.recording.length === 0) {
        res.status(404).send('no such round').end();
        return;
    }
    const midi = new Midi.Midi();
    const track = midi.addTrack();
    // cut out notes that started waay before the track started
    const orderedRec = round.recording.sort((a, b) => a.time - b.time).filter(n => n.time > -3);
    const startTime = orderedRec[0].time; // make the midi t=0 be the first note
    orderedRec.forEach(n => track.addNote({
        ...n,
        time: n.time - startTime,
        velocity: 0.7,
    }));
    res.type('audio/midi').set('Content-disposition', `attachment; filename=${roomId}_${roundIdx}.mid`).send(Buffer.from(midi.toArray())).end();
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

const gameOverBroadcast = (room: Room) => {
    const gameOverInfo: GameOverInfo = {
        rounds: room.rounds.map(r => ({
            songNames: r.song.songNames,
            players: r.guesses.reduce<GameOverPlayerRoundInfo[]>((pl, g) => {
                const playerInfo = pl.find(p => p.playerId === g.playerId);
                if (!playerInfo) {
                    // maybe a dropped out player
                    pl.push({
                        playerId: g.playerId,
                        name: '???',
                        guesses: [g.guess],
                        isCorrect: g.isCorrect,
                    });
                } else {
                    playerInfo.guesses.push(g.guess);
                    if (g.isCorrect) {
                        playerInfo.isCorrect = true;
                    }
                }
                return pl;
            }, room.players.filter(p => !p.isBot).map(p => ({
                playerId: p.id,
                name: p.name,
                guesses: [],
                isCorrect: false,
            }))),
        })),
    };
    io.to(room.roomId).emit('game over', gameOverInfo);
}

const runBot = (bot: Player, round: RoundInfo, room: Room, accuracy: number = 0.9) => {
    const { startTime, song, notes, speedFactor } = round;
    const startDelay = startTime - Date.now();
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
        const noteTime = note.time - Math.random() * (1 - accuracy) - accuracy + 1;
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
        room.rounds[room.currentRound].recording.push({
            name: n.note,
            time: noteTime * speedFactor,
            duration: noteDuration * speedFactor,
        });
    });
}

const startNextRound = (room: Room) => {
    // start a new round, clear stuff from previous round
    room.currentRound = room.currentRound + 1;
    room.players.forEach(p => p.notes = []);
    room.botTimers.forEach(clearTimeout);
    room.botTimers = [];

    const round = room.rounds[room.currentRound];
    const song = round.song;
    const { uniqueNotes } = song;
    const { players } = room;

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
    round.startTime = startTime;

    players.forEach((player) => {
        const roundInfo: RoundInfo = {
            speedFactor: round.speedFactor,
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
                // let everyone know someone disconnected
                roomInfoBroadcast(room);
                // if everyone left is ready, start the next round
                if (room.players.every(p => p.isReady)) {
                    startNextRound(room);
                }
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

    socket.on('request end game', () => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        if (!room) {
            return;
        }
        const player = room.players.find((player) => player.id === socket.id);
        if (!player) {
            return;
        }
        player.isReady = true;
        if (!room.players.every(p => p.isReady)) {
            roomInfoBroadcast(room);
            return; // not everyone is ready yet, but broadcast the updated readiness
        }
        gameOverBroadcast(room);
    });
    
    socket.on('request start round', ({ speedFactor, round }: NextRoundProps) => {
        const roomId = getRoomId(socket);
        const room = rooms.find(({ roomId: id }) => id === roomId);

        if (room) {
            if (room.currentRound + 1 !== round || round >= room.rounds.length) {
                return; // already starting?
            }
            room.rounds[round].speedFactor = speedFactor;
            const player = room.players.find((player) => player.id === socket.id);
            player.isReady = true;
            if (!room.players.every(p => p.isReady)) {
                roomInfoBroadcast(room);
                return; // not everyone is ready yet, but broadcast the updated readiness
            }
            startNextRound(room);
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
                    // construct midi if a round is active
                    const round = room.currentRound >= 0 && room.rounds[room.currentRound];
                    if (round) {
                        if (event === 'down') {
                            // add
                            const activeNote = round.notesActive.find(n => n.note === mapped.note);
                            if (activeNote) {
                                // ignore
                                return;
                            }
                            // start a new note
                            round.notesActive.push({
                                note: mapped.note,
                                time: Date.now(),
                            });
                        } else {
                            const idx = round.notesActive.findIndex(n => n.note === mapped.note);
                            if (idx < 0) {
                                return; // up without a down
                            }
                            const noteTime = (round.notesActive[idx].time - round.startTime) / 1000;
                            const noteDuration = (Date.now() - round.notesActive[idx].time) / 1000;
                            round.notesActive.splice(idx, 1);
                            round.recording.push({
                                name: mapped.note,
                                time: noteTime,
                                duration: noteDuration,
                            });
                        }
                    }
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