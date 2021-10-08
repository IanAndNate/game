import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { countDown } from '../../../../controllers/game/utils';

interface Props {
    timeTillLaunch: number;
    totalDuration: number;
    speedFactor: number;
}

const Container = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
`;

const TimeLeftContainer = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: small;
    font-weight: bold;
    margin: 6px 4px;
`;

const progressBar = keyframes`
    0% {
        width: 0%;
    }
    100% {
        width: 100%;
    }
`;

const TimedBar = styled.div<{ duration: number }>`
    background-color: #6a8cc0;
    height: 4px;
    animation: ${progressBar} ${({ duration} ) => Math.ceil(duration/1000)}s linear;
`;

const TimeLeft = ({ timeTillLaunch, totalDuration, speedFactor }: Props) => {
    const totalSecs = Math.ceil(totalDuration / 1000) * speedFactor;
    const [secondsToEnd, setSecondsToEnd] = useState<number>(totalSecs);
    useEffect(() => {
        if (timeTillLaunch === 0) {
            return countDown(0, Math.ceil(totalSecs), 1000, (i) => {
                setSecondsToEnd(i);
            });
        }
    }, [timeTillLaunch]);
    return <TimeLeftContainer>{Math.floor(secondsToEnd / 60)}:{String(secondsToEnd % 60).padStart(2, '0')}</TimeLeftContainer>
}

export const ProgressIndicator = (props: Props) => {
    const { timeTillLaunch, totalDuration, speedFactor } = props;
    return <Container><TimeLeft {...props}/>{timeTillLaunch === 0 && <TimedBar duration={totalDuration * speedFactor}/>}</Container>
}