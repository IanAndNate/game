import { createHook, createStore } from 'react-sweet-state';
import { GameStatus, State } from './types';
import * as actions from './actions';
import { useCallback, useEffect } from 'react';
import { useHistory } from 'react-router';

const initialState: State = {
    status: GameStatus.Disconnected,
    keysDown: new Set<string>(),
    players: [],
    timeDiff: { diff: 0, measures: [] },
    toneStarted: false,
};

type Actions = typeof actions;

const store = createStore<State, Actions>({ initialState, actions });
export const useGame = createHook<State, Actions>(store);

export const useCreateAndJoinRoom = () => {
    const history = useHistory();
    return useCallback(async () => {
        const roomIdResponse = await fetch('/new');
        const { roomId } = await roomIdResponse.json();
        history.push(`/game/${roomId}`);
    }, [history]);
};

export const useGameRoom = (roomId: string) => {
    const [, { joinRoom, leaveRoom }] = useGame();
    useEffect(() => {
        joinRoom(roomId);
        return leaveRoom;
    }, [roomId]);
};

export const usePollLatency = () => {
    const [, { ping }] = useGame();
    let calculateTimeDiff = true;
    useEffect(() => {
        const timer = setInterval(() => ping(calculateTimeDiff), 500);
        // stop calculating the time diff after a bit as it's expensive and uses up memory
        setTimeout(() => {
            calculateTimeDiff = false;
        }, 60000);
        return () => clearInterval(timer);
    }, []);
};

export const useKeyboard = () => {
    const [, { keyDown, keyUp }] = useGame();
    useEffect(() => {
        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);

        return () => {
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('keyup', keyUp);
        }
    }, []);
}