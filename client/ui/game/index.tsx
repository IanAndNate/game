import React from 'react';
import { useGame, useGameRoom, usePollLatency } from '../../controllers/game';
import { GameStatus } from '../../controllers/game/types';
import { GameOver } from './game-over';
import { Guess } from './guess';
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
        case GameStatus.Starting:
        case GameStatus.Running:
            return <Play />;
        case GameStatus.Guessing:
        case GameStatus.Spectating:
            return <Guess />;
        case GameStatus.GameOver:
            return <GameOver />;
        case GameStatus.Disconnected:
            return <>No such room, <a href="/">return home</a></>;
        default:
            return null;
    }
}