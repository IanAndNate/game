import React from 'react';
import { useGame, useKeyboard } from "../../../controllers/game"
import { GameStatus } from '../../../controllers/game/types';

export const Play = () => {
    const [{ latency, timeDiff, piece, status }] = useGame();
    useKeyboard();
    return <>
        <p>latency: {latency}ms</p>
        <p>timeDiff: {timeDiff}ms</p>
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
        <div className={status === GameStatus.Running ? 'playbar started': 'playbar'} style={{ top: 0, bottom: 0, position: 'absolute', width: '5px', left: 0, backgroundColor: 'red' }}></div>
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