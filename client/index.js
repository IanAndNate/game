import { io } from "socket.io-client";
import React, {useCallback, useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import * as Tone from 'tone';

const KEY_MAPPINGS = {
    'a': 'A4',
    's': 'B4',
    'd': 'C4',
    'f': 'D4',
    'g': 'E4',
    'h': 'F4',
    'j': 'G4',
}

function App() {
    const [socket, setSocket] = useState(null);
    const [keysDown, setKeysDown] = useState({});
    const [toneStarted, setToneStarted] = useState(false);
    const [synth, setSynth] = useState(null);

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
                    synth.triggerAttack(KEY_MAPPINGS[e], Tone.now());
                }
            })
            socket.on('keyup broadcast', (e) => {
                console.log(e);
                synth.triggerRelease([KEY_MAPPINGS[e]], Tone.now());
            })
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

    return <>Oh hai</>;
}


ReactDOM.render(<App />, document.getElementById('root'));

