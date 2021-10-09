import React from "react";
import { useGame } from "../../../controllers/game";
import styled from "@emotion/styled";
import {
  GameOverPlayerRoundInfo,
  GameOverRoundInfo,
} from "../../../shared/types";

const RoundContainer = styled.div``;

interface RoundProps extends GameOverRoundInfo {
  idx: number;
  roomId: string;
}

const PlayerGuesses = ({
  name,
  isCorrect,
  guesses,
}: GameOverPlayerRoundInfo) => {
  return (
    <div>
      <h4>
        {name} guesses ({isCorrect ? "correct" : "incorrect"})
      </h4>
      <ul>
        {guesses.map((guess) => (
          <li key={guess}>{guess}</li>
        ))}
      </ul>
    </div>
  );
};

const Round = ({ idx, songNames, players, roomId }: RoundProps) => {
  return (
    <RoundContainer>
      <h3>
        Round {idx + 1} results (
        <a href={`/game/${roomId}/${idx}.mid`} target="_blank" rel="noreferrer">
          MIDI
        </a>
        )
      </h3>
      <div>Song: &ldquo;{songNames.join('" aka "')}&rdquo;</div>
      <div>
        {players.map((guesses) => (
          <PlayerGuesses key={guesses.playerId} {...guesses} />
        ))}
      </div>
    </RoundContainer>
  );
};

export const GameOver = () => {
  const [{ gameOverInfo, roomId }] = useGame();
  return (
    <>
      {gameOverInfo.rounds.map((r, idx) => (
        <Round key={idx} roomId={roomId} idx={idx} {...r} />
      ))}
      <div>
        <a href="/">back to home</a>
      </div>
    </>
  );
};
