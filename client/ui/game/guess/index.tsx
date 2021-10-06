import React, { useCallback, useState } from 'react';
import { useGame } from '../../../controllers/game';
import styled from '@emotion/styled';
import { Room } from '../../common/room';

const Wrapper = styled.div``;

const Guesses = () => {
    const [{ guesses }] = useGame();
    return (<ul>{guesses.map(({attempt, isCorrect}, idx) => <li key={idx}>{attempt} is {isCorrect ? 'correct!' : 'incorrect'}</li>)}</ul>);
}

export const Guess = () => {
    const [{ players, piece: { speedFactor } = { speedFactor: 1}, currentRound, totalRounds, guesses }, { startNextRound, makeGuess }] = useGame();
    const [guess, setGuess] = useState<string>('');
    const isLastRound = currentRound + 1 === totalRounds;
    const next = useCallback(() => {
        if (isLastRound) {
            // TODO end game, show final scores
            window.location.href = '/';
            return;
        }
        startNextRound({ speedFactor });
    }, [speedFactor, isLastRound]);
    const updateGuess = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setGuess(ev.target.value);
    }
    const submitGuess = (ev: React.FormEvent<HTMLFormElement>) => {
        makeGuess(guess);
        setGuess('');
        ev.preventDefault();
    }
    const hasCorrect = guesses.find(g => g.isCorrect) !== undefined;
    const isReady = players.find(p => p.isCurrent)?.isReady;
    const waitingFor = players.filter(p => !p.isReady).length;

    return <Wrapper>
        <h2>Round {currentRound + 1} / {totalRounds}: Guess the song!</h2>
        <Room players={players} disabled={false} action={<>Waiting for {waitingFor} player{waitingFor === 1 ? '' : 's'}</>}/>
        <form onSubmit={submitGuess}>
            <input placeholder="Enter a song title..." onChange={updateGuess} value={guess} disabled={hasCorrect}/>
        </form>
        <Guesses />
        <button onClick={next} disabled={isReady}>{hasCorrect ? (isLastRound ? 'End game' : 'Ready') : 'Give up'}</button>
    </Wrapper>
}