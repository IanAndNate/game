import {io} from "socket.io-client";
import React, {useCallback, useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import * as Tone from 'tone';
import {BrowserRouter, Route, Switch, useHistory} from "react-router-dom";

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

const measureLatency = (socket, setLatency, setTimeDiff) => {
    const start = Date.now();

    // volatile, so the packet will be discarded if the socket is not connected
    socket.volatile.emit("ping", (serverTime) => {
        const latency = Date.now() - start;
        const localTime = Date.now() - Math.ceil(latency / 2);
        console.log(serverTime, localTime);
        const timeDiff = serverTime - localTime;
        setLatency(latency);
        setTimeDiff(timeDiff);
    });
}

const Game = ({match: {params: {roomId}}}) => {
    const [socket, setSocket] = useState(null);
    const [keysDown, setKeysDown] = useState({});
    const [toneStarted, setToneStarted] = useState(false);
    const [synth, setSynth] = useState(null);
    const [piece, setPiece] = useState(null);
    const [started, setStarted] = useState(false);
    const [latency, setLatency] = useState(0);
    const [timeDiff, setTimeDiff] = useState(0);

    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);
        return () => newSocket.close();
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

            measureLatency(socket, setLatency, setTimeDiff)

            setInterval(() => {
                measureLatency(socket, setLatency, setTimeDiff);
            }, 5000);
        }
    }, [socket, setLatency, setTimeDiff, synth]);

    useEffect(() => {
        if (socket) {
            socket.emit('join room', roomId);
        }
    }, [socket]);

    useEffect(() => {
        // Synth setup;
        setSynth(new Tone.PolySynth(Tone.Synth).toDestination());
    }, [toneStarted, setSynth])

    const keyDownHandler = useCallback((e) => {
        if (!toneStarted) {
            Tone.start().then(() => setToneStarted(true));

        }
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
        if (socket) {
            socket.emit('request start game');
        }
    }, [socket]);

    return <>
        <p>latency: {latency}</p>
        <p>timeDiff: {timeDiff}</p>
        <button onClick={onStartHandler}>Start</button>
        <input type={'text'}/>
        <style>
            {`.started {
                transform: translateX(1546px);
            }

            .playbar {
                transition: transform 60s linear 0s;
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

const NOTE_POSITIONS = {}

const getPosition = (note) => {
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
            <Route exact path="/game/:roomId" render={routeProps => (
                <Game {...routeProps} />
            )}/>
        </Switch>
    </BrowserRouter>;
}


ReactDOM.render(<App/>, document.getElementById('root'));

