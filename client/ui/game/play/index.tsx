import React from 'react';
import { useGame, useKeyboard } from '../../../controllers/game'
import { GameStatus } from '../../../controllers/game/types';
import { Room } from '../../common/room';
import styled from '@emotion/styled';
import { LatencyPanel } from '../../common/latency-panel';

const MusicContainer = styled('div')`
    height: 500px;
    overflow: hidden;
    perspective: 1000px;
    position: relative;
    display: flex;
    justify-content: center;
    perspective-origin: bottom;
`;

const MusicPage = styled.div<{ duration: number; numberNotes: number; started: boolean; speedFactor: number }>`
    position: absolute;
    height: ${({ duration }) => duration * 500}px;
    width: ${({ numberNotes }) => numberNotes * 30}px;
    transform: rotateX(70deg);
    bottom: 0;
    transform-origin: bottom;
    transition: transform ${({ duration, speedFactor }) => duration * speedFactor}s linear 0s;
    transform: rotateX(71deg) ${({ started, duration }) => started ? 'translate3d(0, ' + duration * 500 + 'px, 0)' : ''};
`;

const NoteBar = styled('div')`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Note = styled.span<{ time: number; duration: number; note: string; }>`
    position: absolute;
    padding: 10px;
    box-sizing: border-box;
    width: 18px;
    bottom: ${({ time }) => time * 500}px;
    height: ${({ duration }) => duration * 500}px;
    background: linear-gradient(0deg, #93d793 0%, #93d79300 100%);
    left: ${({ note }) => getPosition(note) * 30}px;
    border-style: solid;
    border-color: black;
    border-width: 5px 1px;
`;

const UserNote = styled.button`
    width: 20px;
    margin-right: 10px;
`;

export const Play = () => {
    const [{ piece, status, players }, { mouseDown, mouseUp }] = useGame();
    useKeyboard();

    const { song, notes, speedFactor } = piece || { song: null, piece: null };
    const lastNote = song && song[ song.length - 1 ];
    const duration = lastNote && (lastNote.time + lastNote.duration);
    const numberNotes = notes && notes.length;

    return <>
        <Room players={players} disabled={false}/>
        <MusicContainer>
            <MusicPage numberNotes={numberNotes}
                       duration={duration}
                       speedFactor={speedFactor}
                       started={status === GameStatus.Running}>
                {song && song
                    .filter(({ key }) => !!key)
                    .map(({ key, time, duration }, i) =>
                        <Note key={i}
                              time={time}
                              note={key}
                              duration={duration}/>
                    )}
            </MusicPage>
        </MusicContainer>
        <NoteBar>
            {notes && notes.map(({ key }, i) =>
                <UserNote value={key} onMouseDown={mouseDown} onMouseUp={mouseUp} key={i}>{key}</UserNote>
            )}
        </NoteBar>
        <LatencyPanel/>
    </>
}

let nextPosition = 0;

const NOTE_POSITIONS: { [ note: string ]: number } = {}

const getPosition = (note: string) => {
    const existing = NOTE_POSITIONS[ note ];
    if (typeof existing !== 'undefined') {
        return existing;
    }
    NOTE_POSITIONS[ note ] = nextPosition;
    nextPosition++;
    return NOTE_POSITIONS[ note ];
}