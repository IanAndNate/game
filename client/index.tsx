import { io, Socket } from 'socket.io-client';
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as Tone from 'tone';
import { BrowserRouter, Route, RouteComponentProps, Switch, useHistory } from "react-router-dom";
import { Sampler } from 'tone';

const Welcome = () => {

    let history = useHistory();

    const onNewGameClick = useCallback(async (e) => {
        const roomIdResponse = await fetch('/new');
        const {roomId} = await roomIdResponse.json();
        history.push(`/game/${roomId}`);
    }, [])

    return <>
        Welcome
        <button onClick={onNewGameClick}>New game</button>
    </>
}

const measureLatency = (socket: Socket): Promise<{ latency: number, timeDiff: number }> => {
    const start = Date.now();

    return new Promise((resolve) => {
        socket.volatile.emit("ping", (serverTime: number) => {
            const sendTime = serverTime - start;
            const receiveTime = Date.now() - serverTime;
            const latency = Date.now() - start;
            const timeDiff = (sendTime + receiveTime - latency) / 2;
            resolve({ latency, timeDiff });
        });
    });
}

interface Note {
    key: string;
    duration: number;
    time: number;
}

type GameRouteProps = RouteComponentProps<{ roomId: string }>;

const Game = ({match: {params: {roomId}}}: GameRouteProps) => {
    const [socket, setSocket] = useState<Socket>(null);
    const [keysDown, setKeysDown] = useState<{ [key: string]: boolean }>({});
    const [toneStarted, setToneStarted] = useState<boolean>(false);
    const [synth, setSynth] = useState<Sampler>(null);
    const [piece, setPiece] = useState<[Note]>(null);
    const [started, setStarted] = useState<boolean>(false);
    const [latency, setLatency] = useState<number>(0);
    const [timeDiff, setTimeDiff] = useState<number>(0);

    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);
        return () => {
            newSocket.close();
        }
    }, [setSocket]);

    useEffect(() => {
        if (socket) {
            socket.on('start game', ({song, startTime}) => {
                setPiece(song);
                const forwardStart = startTime - Date.now() + timeDiff;
                setTimeout(() => {
                    setStarted(true);
                }, forwardStart);
            });
        }
    }, [socket, setPiece, setStarted, timeDiff]);

    useEffect(() => {
        if (socket) {
            socket.on('keydown broadcast', (e) => {
                if (synth) {
                    synth.triggerAttack(e, Tone.now());
                }
            });
            socket.on('keyup broadcast', (e) => {
                if (synth) {
                    synth.triggerRelease([e], Tone.now());
                }
            });

            measureLatency(socket).then(({ latency, timeDiff }) => {
                setLatency(latency);
                setTimeDiff(timeDiff);
            });

            setInterval(() => {
                measureLatency(socket).then(({ latency, timeDiff }) => {
                    setLatency(latency);
                    setTimeDiff(timeDiff);
                });
            }, 2000);
        }
    }, [socket, setLatency, setTimeDiff, synth]);

    useEffect(() => {
        if (socket) {
            socket.emit('join room', roomId);
            socket.on('alert', ({ message }) => {
                window.alert(message);
            });
        }
    }, [socket]);

    useEffect(() => {
        if (toneStarted) {
            const sampler = new Tone.Sampler({
                urls: {
                    "C1": "notes/C1.mp3",
                    "C2": "notes/C2.mp3",
                    "C3": "notes/C3.mp3",
                    "C4": "notes/C4.mp3",
                    "C5": "notes/C5.mp3",
                    "C6": "notes/C6.mp3",
                    "C7": "notes/C7.mp3",
                    "C8": "notes/C8.mp3",
                    "A1": "notes/A1.mp3",
                    "A2": "notes/A2.mp3",
                    "A3": "notes/A3.mp3",
                    "A4": "notes/A4.mp3",
                    "A5": "notes/A5.mp3",
                    "A6": "notes/A6.mp3",
                    "A7": "notes/A7.mp3",
                },
                release: 3,
                baseUrl: "/",
            });
            const comp = new Tone.Compressor(-30, 3);
            const vol = new Tone.Volume(-12);
            sampler.chain(comp, vol, Tone.Destination);
            sampler.toDestination();
            Tone.loaded().then(() => {
                setSynth(sampler);
            });

            return () => {
                sampler.releaseAll();
                sampler.dispose();
            }
        }
    }, [toneStarted, setSynth])

    const keyDownHandler = useCallback((e) => {
        if (socket) {
            if (!keysDown[e.key]) {
                socket.emit('keydown', e.key);
                keysDown[e.key] = true;
                setKeysDown(keysDown);
            }
        }
    }, [socket, keysDown, setKeysDown]);

    const keyUpHandler = useCallback((e) => {
        if (socket) {
            socket.emit('keyup', e.key);
            delete keysDown[e.key];
            setKeysDown(keysDown);
        }
    }, [socket, keysDown, setKeysDown]);

    useEffect(() => {
        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('keyup', keyUpHandler);

        return () => {
            window.removeEventListener('keydown', keyDownHandler);
            window.removeEventListener('keyup', keyUpHandler);
        }
    }, [keyDownHandler, keyUpHandler]);

    const onStartHandler = useCallback(() => {
        if (!toneStarted) {
            Tone.start().then(() => setToneStarted(true));
        }
        if (socket) {
            socket.emit('request start game');
        }
    }, [socket]);

    return <>
        <p>latency: {latency}ms</p>
        <p>timeDiff: {timeDiff}ms</p>
        <button onClick={onStartHandler}>Start</button>
        <input type={'text'}/>
        <style>
            {`.started {
                transform: translateX(6000px);
            }

            .playbar {
                transition: transform 120s linear 0s;
            }`}
        </style>
        <div style={{position: 'relative'}}>{piece && piece.map(({key, time, duration}, i) => <span key={i} style={{
            position: 'absolute',
            left: time * 100,
            width: duration * 100,
            backgroundColor: !key ? 'rgb(215 169 147)': '#93d793',
            top: getPosition(key) * 40,
            padding: '10px',
            boxSizing: 'border-box'
        }}>{key}</span>)}</div>
        <div className={started? 'playbar started': 'playbar'} style={{ top: 0, bottom: 0, position: 'absolute', width: '5px', left: 0, backgroundColor: 'red' }}></div>
    </>
}

let nextPosition = 0;

const NOTE_POSITIONS:{ [note: string]: number } = {}

const getPosition = (note: string) => {
    const existing = NOTE_POSITIONS[note];
    if (typeof existing !== 'undefined') {
        return existing;
    }
    NOTE_POSITIONS[note] = nextPosition;
    nextPosition++;
    return NOTE_POSITIONS[note];
}

function App() {
    return <BrowserRouter>
        <Switch>
            <Route exact path="/">
                <Welcome/>
            </Route>
            <Route exact path="/game/:roomId" render={(routeProps: GameRouteProps) => (
                <Game {...routeProps} />
            )}/>
        </Switch>
    </BrowserRouter>;
}


ReactDOM.render(<App/>, document.getElementById('root'));

