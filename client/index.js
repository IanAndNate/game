import {io} from "socket.io-client";
import React, {useCallback, useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import * as Tone from 'tone';
import {BrowserRouter, Route, Switch} from "react-router-dom";

const Welcome = () => {
    return <>Welcome</>
}

const Game = ({ match: { params: { gameId }} }) => {
    const [socket, setSocket] = useState(null);
    const [keysDown, setKeysDown] = useState({});
    const [toneStarted, setToneStarted] = useState(false);
    const [synth, setSynth] = useState(null);
    const [piece, setPiece] = useState(null);

    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);
        return () => newSocket.close();
    }, [setSocket]);

    useEffect(() => {
        if (socket) {
            socket.on('keydown broadcast', (e) => {
                console.log(e);
                if (synth) {
                    synth.triggerAttack(e, Tone.now());
                }
            });
            socket.on('keyup broadcast', (e) => {
                console.log(e);
                synth.triggerRelease([e], Tone.now());
            });
            socket.on('start game', (piece) => {
                setPiece(piece);
            });
        }
    }, [socket, setPiece]);

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

    return <><button onClick={onStartHandler}>Start</button>{piece && piece.map(({ key }) => <span>{key}</span>)}</>
}

function App() {
    return <BrowserRouter>
        <Switch>
            <Route exact path="/">
                <Welcome/>
            </Route>
            <Route exact path="/game/:gameId" render={routeProps => (
                <Game {...routeProps} />
            )}/>
        </Switch>
    </BrowserRouter>;
}


ReactDOM.render(<App/>, document.getElementById('root'));

