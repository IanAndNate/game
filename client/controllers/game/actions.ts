import { StoreActionApi } from 'react-sweet-state';
import { GameStatus, State } from './types';
import { io } from 'socket.io-client';
import * as Tone from 'tone';

const initSynth = () => async ({ getState }: StoreActionApi<State>) => {
    const synth = new Tone.Sampler({
        urls: {
            "C1": "notes/C1.mp3",
            "C2": "notes/C2.mp3",
            "C3": "notes/C3.mp3",
            "C4": "notes/C4.mp3",
            "C5": "notes/C5.mp3",
            "C6": "notes/C6.mp3",
            "C7": "notes/C7.mp3",
            "C8": "notes/C8.mp3",
        },
        release: 3,
        baseUrl: "/",
    }).toDestination();
    await Tone.loaded();
    await Tone.start();
    const { socket } = getState();
    socket.on('keydown broadcast', (e) => {
        synth.triggerAttack(e, Tone.now());
    });
    socket.on('keyup broadcast', (e) => {
        synth.triggerRelease([e], Tone.now());
    });
}

export const joinRoom = (roomId: string) => ({ getState, setState, dispatch }: StoreActionApi<State>) => {
    const socket = io();
    socket.emit('join room', roomId);

    // set up all the handlers here
    socket.on('start game', ({ song, startTime }) => {
        setState({ 
            status: GameStatus.Starting,
            piece: song,
        });
        dispatch(initSynth());
        const { timeDiff } = getState();
        const forwardStart = startTime - Date.now() + timeDiff;
        setTimeout(() => {
            setState({
                status: GameStatus.Running,
            });
        }, forwardStart);
    });
    socket.on('alert', ({ message }) => {
        window.alert(message);
    });
    socket.on('players', (players) => {
        setState({
            players,
        });
    });

    setState({
        socket,
        roomId,
        status: GameStatus.Lobby,
    });
};

export const leaveRoom = () => ({ getState, setState }: StoreActionApi<State>) => {
    const { socket } = getState();
    socket.close();
    setState({
        status: GameStatus.Disconnected,
        roomId: undefined,
    });
};

export const startGame = () => ({ getState, setState }: StoreActionApi<State>) => {
    const { socket } = getState();
    socket.emit('request start game');
    setState({
        status: GameStatus.Loading,
    });
};

export const ping = () => async ({ getState, setState }: StoreActionApi<State>) => {
    const { socket } = getState();

    const start = Date.now();
    return new Promise<void>((resolve) => {
        socket.volatile.emit("ping", (serverTime: number) => {
            const sendTime = serverTime - start;
            const receiveTime = Date.now() - serverTime;
            const latency = Date.now() - start;
            const timeDiff = (sendTime + receiveTime - latency) / 2;
            setState({
                latency,
                timeDiff,
            })
            resolve();
        });
    });
};

export const keyDown = (e: KeyboardEvent) => ({ getState, setState }: StoreActionApi<State>) => {
    const { keysDown, socket } = getState();
    if (!keysDown.has(e.key)) {
        socket.emit('keydown', e.key);
        keysDown.add(e.key);
        setState({ keysDown });
    }
}

export const keyUp = (e: KeyboardEvent) => ({ getState, setState }: StoreActionApi<State>) => {
    const { keysDown, socket } = getState();
    if (keysDown.has(e.key)) {
        socket.emit('keyup', e.key);
        keysDown.delete(e.key);
        setState({ keysDown });
    }
}
