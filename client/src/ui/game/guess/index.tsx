import React, { useCallback, useState } from "react";
import { useGame } from "../../../controllers/game";
import styled from "@emotion/styled";
import { Room } from "../../common/room";
import { GameStatus } from "../../../controllers/game/types";

const Wrapper = styled.div`
  button {
    margin-bottom: 8px;
    margin-right: 8px;
  }
`;

const Guesses = () => {
  const [{ guesses }] = useGame();
  return (
    <ul>
      {guesses.map(({ attempt, isCorrect }, idx) => (
        <li key={idx}>
          {attempt} is {isCorrect ? "correct!" : "incorrect"}
        </li>
      ))}
    </ul>
  );
};

export const Guess = () => {
  const [
    {
      status,
      roomId,
      players,
      piece: { speedFactor } = { speedFactor: 1 },
      currentRound,
      totalRounds,
      guesses,
    },
    { startRound, makeGuess, endGame },
  ] = useGame();
  const [guess, setGuess] = useState<string>("");
  const isLastRound = currentRound + 1 === totalRounds;
  const next = useCallback(() => {
    if (isLastRound) {
      endGame();
      return;
    }
    startRound({ speedFactor, round: currentRound + 1 });
  }, [isLastRound, startRound, speedFactor, currentRound, endGame]);
  const repeatRound = useCallback(() => {
    startRound({ speedFactor, round: currentRound });
  }, [currentRound, speedFactor, startRound]);
  const updateGuess = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(ev.target.value);
  };
  const submitGuess = (ev: React.FormEvent<HTMLFormElement>) => {
    makeGuess(guess);
    setGuess("");
    ev.preventDefault();
  };
  const hasCorrect = guesses.find((g) => g.isCorrect) !== undefined;
  const isReady = players.find((p) => p.isCurrent)?.isReady;
  const waitingFor = players.filter((p) => !p.isReady).length;

  const nextRoundLabel = isLastRound ? "End game" : "Next round";

  return (
    <Wrapper>
      <h2>
        Round {currentRound + 1} / {totalRounds}: Guess the song!{" "}
        {status === GameStatus.Spectating && "(Spectating)"}
      </h2>
      <Room
        players={players}
        disabled={false}
        action={
          <>
            Waiting for {waitingFor} player
            {waitingFor === 1 ? "" : "s"}
          </>
        }
      />
      <form onSubmit={submitGuess}>
        <input
          placeholder="Enter a song title..."
          onChange={updateGuess}
          value={guess}
          disabled={hasCorrect}
        />
      </form>
      <Guesses />
      <button onClick={next} disabled={isReady}>
        {hasCorrect ? nextRoundLabel : `Pass (${nextRoundLabel})`}
      </button>
      <button onClick={repeatRound}>Repeat this round</button>
      {status === GameStatus.Guessing && (
        <div>
          <a
            href={`/game/${roomId}/${currentRound}.mid`}
            target="_blank"
            rel="noreferrer"
          >
            Download a MIDI of your masterpiece!
          </a>
        </div>
      )}
    </Wrapper>
  );
};
