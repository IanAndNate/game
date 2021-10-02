import React from 'react';
import { useGame, useGameRoom, usePollLatency } from '../../controllers/game';
import { GameStatus } from '../../controllers/game/types';
import { Lobby } from './lobby';
import { Play } from './play';
import { GameRouteProps } from './types';

export const Game = ({ match: { params: { roomId } }}: GameRouteProps) => {
    const [{ status }] = useGame();
    useGameRoom(roomId);
    usePollLatency();

    switch (status) {
        case GameStatus.Lobby:
            return <Lobby/>;
        case GameStatus.Loading:
            return <>Game is loading...</>;
        case GameStatus.Starting:
        case GameStatus.Running:
            return <Play />;
        default:
            return null;
    }
}