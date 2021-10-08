import React, { useEffect, useRef, useState } from 'react';
import { useGame, useKeyboard } from '../../../controllers/game'
import { GameStatus } from '../../../controllers/game/types';
import { Room } from '../../common/room';
import styled from '@emotion/styled';
import { LatencyPanel } from '../../common/latency-panel';
import { keyframes } from '@emotion/react';
import { TRACK_WIDTH } from '../../common/note/constants';
import { NoteBar, UserNote, Note } from '../../common/note/styled';
import { ProgressIndicator } from './progress-indicator';

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
`

export const Play = () => {
    const [{ piece, status, players, keysDown, timeTillLaunch, currentRound, totalRounds }, { mouseDown, mouseUp }] = useGame();
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

    const { song, notes, speedFactor, totalDuration } = piece || { song: null, piece: null };
    const duration = totalDuration / 1000 + 3 / speedFactor;
    const numberNotes = notes && notes.length;

    return <Container>
        <div>
            <h2>Round {currentRound + 1} / {totalRounds}</h2>
            <Room players={players} disabled={false}><LatencyPanel/></Room>
        </div>
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
                              duration={duration}
                              speedFactor={speedFactor}/>
                    )}
            </MusicPage>
        </MusicContainer>
        <NoteBar>
            {notes && notes.map(({ key }, i) =>
                <UserNote note={key} value={key} onPointerDown={mouseDown} onPointerUp={mouseUp}
                          key={i} isPressed={keysDown.has(key)}>{key}</UserNote>
            )}
        </NoteBar>
        <ProgressIndicator timeTillLaunch={timeTillLaunch} totalDuration={totalDuration} speedFactor={speedFactor} />
    </Container>
}