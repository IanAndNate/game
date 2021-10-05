import { StoreActionApi } from 'react-sweet-state';
import { GameStatus, State } from './types';
import { io } from 'socket.io-client';
import * as Tone from 'tone';
import { MouseEvent } from 'react';
import { KeyPress } from '../../../types';
import { countDown, median } from './utils';

const initSynth = () => async ({ getState, setState }: StoreActionApi<State>) => {
    const sampler = new Tone.Sampler({
        urls: {
            'C1': 'notes/C1.mp3',
            'C2': 'notes/C2.mp3',
            'C3': 'notes/C3.mp3',
            'C4': 'notes/C4.mp3',
            'C5': 'notes/C5.mp3',
            'C6': 'notes/C6.mp3',
            'C7': 'notes/C7.mp3',
            'C8': 'notes/C8.mp3',
            'A1': 'notes/A1.mp3',
            'A2': 'notes/A2.mp3',
            'A3': 'notes/A3.mp3',
            'A4': 'notes/A4.mp3',
            'A5': 'notes/A5.mp3',
            'A6': 'notes/A6.mp3',
            'A7': 'notes/A7.mp3',
        },
        release: 3,
        baseUrl: '/',
    }).toDestination();

    const comp = new Tone.Compressor(-30, 3);
    const vol = new Tone.Volume(-12);
    sampler.chain(comp, vol, Tone.Destination);
    sampler.toDestination();

    await Tone.loaded();

    const { socket } = getState();
    socket.on('keydown broadcast', (e: KeyPress) => {
        sampler.triggerAttack(e.note, Tone.now());
        const { players } = getState();
        setState({
            players: players.map(p => p.id === e.playerId ? ({
                ...p,
                isPressed: true,
            }) : p),
        });
    });
    socket.on('keyup broadcast', (e: KeyPress) => {
        sampler.triggerRelease([e.note], Tone.now());
        const { players } = getState();
        setState({
            players: players.map(p => p.id === e.playerId ? ({
                ...p,
                isPressed: false,
            }) : p),
        });
    });
}

export const joinRoom = (roomId: string) => ({ getState, setState, dispatch }: StoreActionApi<State>) => {
    const socket = io();
    socket.emit('join room', roomId);

    // set up all the handlers here
    socket.on('start game', (song) => {
        setState({
            status: GameStatus.Starting,
            piece: song,
        });
        const { startTime } = song;
        const { timeDiff: { diff } } = getState();
        const forwardStart = startTime - Date.now() + diff;
        countDown(forwardStart - 3000, 5, 1000, (i) => {
            if (i === 3) {
                setState({
                    status: GameStatus.Running,
                    timeTillLaunch: i,
                });
            } else {
                setState({
                    timeTillLaunch: i,
                });
            }
        });
    });
    socket.on('alert', ({ message }) => {
        window.alert(message);
    });
    socket.on('players', (players) => {
        setState({
            players,
        });
    });
    socket.on('abort', () => {
        setState({
            status: GameStatus.Disconnected,
        });
    });

    setState({
        socket,
        roomId,
        status: GameStatus.Lobby,
    });
    dispatch(initSynth());
};

export const leaveRoom = () => ({ getState, setState }: StoreActionApi<State>) => {
    const { socket, roomId } = getState();
    socket?.close();
    setState({
        status: GameStatus.Disconnected,
        roomId: undefined,
    });
};

export const startGame = ({ speedFactor }: { speedFactor: number }) => ({
                                                                            getState,
                                                                            setState
                                                                        }: StoreActionApi<State>) => {
    const { socket } = getState();
    socket.emit('request start game', { speedFactor });
    setState({
        status: GameStatus.Loading,
    });
};

export const ping = (calculateTimeDiff: boolean) => ({ getState, setState }: StoreActionApi<State>) => {
    const { socket, timeDiff: { measures } } = getState();
    const start = Date.now();
    return new Promise((resolve) => {
        socket.volatile.emit('ping', (serverTime: number) => {
            const now = Date.now();
            resolve({ start, now, serverTime });
            const latency = now - start; // Measures round trip time, send + receive
            if (calculateTimeDiff) {
                const timeDiff = (start + latency / 2 - serverTime); // This will have some inaccuracies as send time and receive time are not equal but serverTime - now is just receive time.
                measures.push(timeDiff)
                setState({
                    latency,
                    timeDiff: { diff: median(measures), measures },
                });
            } else {
                setState({
                    latency,
                });
            }
        });
    });
};

export const keyDown = (e: KeyboardEvent) => async ({ getState, setState }: StoreActionApi<State>) => {
    const { keysDown, socket, toneStarted } = getState();
    if (!toneStarted) {
        await Tone.start();
        setState({
            toneStarted: true
        });
    }
    if (!keysDown.has(e.key)) {
        socket.emit('keydown', e.key);
        keysDown.add(e.key);
        setState({ keysDown });
    }
}

export const keyUp = (e: KeyboardEvent) => async ({ getState, setState }: StoreActionApi<State>) => {
    const { keysDown, socket, toneStarted } = getState();
    if (!toneStarted) {
        await Tone.start();
        setState({
            toneStarted: true
        });
    }
    if (keysDown.has(e.key)) {
        socket.emit('keyup', e.key);
        keysDown.delete(e.key);
        setState({ keysDown });
    }
}

export const mouseDown = (e: MouseEvent<HTMLButtonElement>) => async ({ getState, setState }: StoreActionApi<State>) => {
    const { keysDown, socket, toneStarted } = getState();
    const key = e.currentTarget.value;
    if (!toneStarted) {
        await Tone.start();
        setState({
            toneStarted: true
        });
    }
    if (!keysDown.has(key)) {
        socket.emit('keydown', key);
        keysDown.add(key);
        setState({ keysDown });
    }
};

export const mouseUp = (e: MouseEvent<HTMLButtonElement>) => async ({ getState, setState }: StoreActionApi<State>) => {
    const { keysDown, socket, toneStarted } = getState();
    const key = e.currentTarget.value;
    if (!toneStarted) {
        await Tone.start();
        setState({
            toneStarted: true
        });
    }
    if (keysDown.has(key)) {
        socket.emit('keyup', key);
        keysDown.delete(key);
        setState({ keysDown });
    }
};
