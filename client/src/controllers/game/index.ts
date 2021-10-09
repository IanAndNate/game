import { createHook, createStore } from "react-sweet-state";
import { GameMode, GameStatus, State } from "./types";
import * as actions from "./actions";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router";

const initialState: State = {
  status: GameStatus.Disconnected,
  keysDown: new Set<string>(),
  players: [],
  timeDiff: { diff: 0, measures: [] },
  toneStarted: false,
  timers: [],
  guesses: [],
  escapeCount: 0,
};

type Actions = typeof actions;

const store = createStore<State, Actions>({ initialState, actions });
export const useGame = createHook<State, Actions>(store);

export const useCreateAndJoinRoom = () => {
  const history = useHistory();
  return useCallback(
    async (gameMode: GameMode, maxKeys: number, botAccuracy: number) => {
      const gameModeParams = {
        [GameMode.Standard]: {},
        [GameMode.BitMidi]: { bitmidi: "1" },
        [GameMode.BitMidi5]: { bitmidi: "5" },
      };
      const roomIdResponse = await fetch(
        `/new?${new URLSearchParams({
          ...gameModeParams[gameMode],
          maxKeys: String(maxKeys),
          botAccuracy: String(botAccuracy),
        }).toString()}`
      );
      const { roomId } = await roomIdResponse.json();
      history.push(`/game/${roomId}`);
    },
    [history]
  );
};

export const useGameRoom = (roomId: string) => {
  const [, { joinRoom, leaveRoom }] = useGame();
  useEffect(() => {
    joinRoom(roomId);
    return leaveRoom;
  }, [joinRoom, leaveRoom, roomId]);
};

export const usePollLatency = () => {
  const [, { ping }] = useGame();
  const [calculateTimeDiff, setCalculateTimeDiff] = useState<boolean>(true);
  useEffect(() => {
    const timer = setInterval(() => ping(calculateTimeDiff), 500);
    // stop calculating the time diff after a bit as it's expensive and uses up memory
    setTimeout(() => {
      setCalculateTimeDiff(false);
    }, 60000);
    return () => clearInterval(timer);
  }, [calculateTimeDiff, ping]);
};

export const useKeyboard = () => {
  const [, { keyDown, keyUp }] = useGame();
  useEffect(() => {
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [keyDown, keyUp]);
};
