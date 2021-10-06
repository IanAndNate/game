import React, { useEffect, useRef, useState } from 'react';
import { useGame, useKeyboard } from '../../../controllers/game'
import { GameStatus } from '../../../controllers/game/types';
import { Room } from '../../common/room';
import styled from '@emotion/styled';
import { LatencyPanel } from '../../common/latency-panel';
import { keyframes } from '@emotion/react';

const COLOURS = ['#774ED8', '#4996C8', '#6EB35E', '#ECD03F', '#F39C3C', '#EA5555', '#996236', '#F8B12C', '#ED732E',
    '#9D221E', '#859D3C', '#382615', '#76B8E8', '#FBC968', '#E7624F', '#3FB0B4', '#F6F1C3', '#EBC9B9', '#E9AAA9', '#BF97B3', '#A17EA4'];

const TRACK_WIDTH = 40;

const MusicContainer = styled.div<{ height: number }>`
    overflow: hidden;
    perspective: ${({ height }) => Math.round(height / 100) * 100}px;
    position: relative;
    display: flex;
    justify-content: center;
    perspective-origin: bottom;
    flex-grow: 2;
    transition: perspective 3s ease-out;
`;

const moveVertically = (duration: number) => keyframes`
    0% {
        transform : scale(1) rotateX(45deg) translate3d(0, 0, 0);
    }
    100% {
        transform: scale(1) rotateX(45deg) translate3d(0, ${duration * 500}px, 0);
    }
`;

const MusicPage = styled.div<{ duration: number; numberNotes: number; started: boolean; speedFactor: number }>`
    height: ${({ duration }) => duration * 500}px;
    width: ${({ numberNotes }) => numberNotes * (TRACK_WIDTH + 10)}px;
    animation : ${({ duration }) => moveVertically(duration)} ${({ duration, speedFactor }) => duration * speedFactor}s linear;
    animation-play-state: ${({ started }) => started ? 'running' : 'paused'};
    animation-fill-mode: both;
    transform-origin: bottom;
    position: absolute;
    bottom: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    -webkit-transform-style: preserve-3d;
    -webkit-transform: scale(1);
    will-change: transform;
`;

const NoteBar = styled('div')`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding-bottom: 10px;
`;

const Note = styled.span<{ time: number; duration: number; note: string; index: number; }>`
    position: absolute;
    padding: 10px;
    box-sizing: border-box;
    width: ${TRACK_WIDTH}px;
    bottom: ${({ time }) => (time + 3) * 500}px;
    height: ${({ duration }) => duration * 500}px;
    background-color: ${({ note }) => COLOURS[ getPosition(note) % COLOURS.length ]};
    left: ${({ note }) => getPosition(note) * (TRACK_WIDTH + 10)}px;
    border-style: solid;
    border-color: black;
    border-width: 5px 1px;
`;

const UserNote = styled.button<{ note: string }>`
    width: ${TRACK_WIDTH}px;
    height: ${TRACK_WIDTH}px;
    margin-right: 10px;
    background-color: ${({ note }) => COLOURS[ getPosition(note) % COLOURS.length ]};
    font-size: 25px;
    text-transform: uppercase;
    color: #FFF;
    text-shadow: 0 0 10px black;
    border: 1px solid #000;
    flex-shrink: 0;
`;

const CountDown = styled.div<{ timeTillLaunch: number }>`
    position: absolute;
    z-index: 3;
    align-items: center;
    font-size: 71px;
    height: 100%;
    display: ${({ timeTillLaunch }) => timeTillLaunch > 0 ? 'flex' : 'none'};
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
`

const RoomContainer = styled.div`
    padding: 0 10px 10px 10px;
`

export const Play = () => {
    const [{ piece, status, players, timeTillLaunch }, { mouseDown, mouseUp }] = useGame();
    useKeyboard();
    const [targetHeight, setTargetHeight] = useState(0);
    const renderTarget = useRef(null);

    useEffect(() => {
        if (renderTarget.current) {
            setTimeout(() => {
                setTargetHeight(renderTarget.current.clientHeight);
            }, 1000);
        }
    }, [renderTarget]);

    const { song, notes, speedFactor } = piece || { song: null, piece: null };
    const lastNote = song && song[ song.length - 1 ];
    const duration = lastNote && (lastNote.time + lastNote.duration) + 3;
    const numberNotes = notes && notes.length;

    return <Container>
        <RoomContainer><Room players={players} disabled={false}><LatencyPanel/></Room></RoomContainer>
        <MusicContainer ref={renderTarget}
                        height={targetHeight}>
            <CountDown timeTillLaunch={timeTillLaunch}>{timeTillLaunch}</CountDown>
            <MusicPage numberNotes={numberNotes}
                       duration={duration}
                       speedFactor={speedFactor}
                       started={status === GameStatus.Running}>
                {song && song
                    .filter(({ key }) => !!key)
                    .map(({ key, time, duration }, i) =>
                        <Note key={i}
                              index={i}
                              time={time}
                              note={key}
                              duration={duration}/>
                    )}
            </MusicPage>
        </MusicContainer>
        <NoteBar>
            {notes && notes.map(({ key }, i) =>
                <UserNote note={key} value={key} onPointerDown={mouseDown} onPointerUp={mouseUp}
                          key={i}>{key}</UserNote>
            )}
        </NoteBar>
    </Container>
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