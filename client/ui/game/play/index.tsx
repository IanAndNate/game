import React from 'react';
import { useGame, useKeyboard } from "../../../controllers/game"
import { GameStatus } from '../../../controllers/game/types';

export const Play = () => {
    const [{ latency, timeDiff, piece, status }, { mouseDown, mouseUp }] = useGame();
    useKeyboard();

    const { song, notes } = piece || { song: null, piece: null };
    const lastNote = song && song[song.length - 1];
    const duration = lastNote && (lastNote.time + lastNote.duration);
    const numberNotes = notes && notes.length;

    return  <>
        <p>latency: {latency}ms</p>
        <p>timeDiff: {timeDiff}ms</p>
        <style>
            {`.started .musicPage {
                transform: rotateX(71deg) translate3d(0, ${duration * 500}px, 0);
            }
            
            .musicContainer {
                height: 500px;
                overflow: hidden;
                perspective: 1000px;
                position: relative;
                display: flex;
                justify-content: center;
            }
            
            .musicPage {
                position: absolute;
                height: ${duration * 500}px;
                width: ${numberNotes * 30}px;
                transform: rotateX(71deg);
                bottom: 0;
                transform-origin: bottom;
                transition: transform ${duration}s linear 0s;
            }
            
            .note {
                position: absolute;
                padding: 10px;
                box-sizing: border-box;
                width: 20px;
            }
            
            .noteBar {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .displayNote {
                width: 20px;
                margin-right: 10px;
            }
`}
        </style>
        <div className={status === GameStatus.Running ? 'musicContainer started': 'musicContainer'}>
            <div className={'musicPage'}>{song && song.filter(({ key }) => !!key).map(({key, time, duration}, i) => <span className={'note'} key={i} style={{
                bottom: time * 500,
                height: duration * 500,
                backgroundColor: !key ? 'rgb(215 169 147)': '#93d793',
                left: getPosition(key) * 30,
            }}></span>)}</div>
        </div>
        <div className={'noteBar'}>
            {notes && notes.map(({ key }, i) =>
                <button value={key} onMouseDown={mouseDown} onMouseUp={mouseUp} className={'displayNote'} key={i} style={{
                    left: getPosition(key) * 40,
                }}>{key}</button>
            )}
        </div>
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