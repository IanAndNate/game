import React from "react";
import { useGame } from "../../../controllers/game";

export const Lobby = () => {
    const [{ latency, timeDiff, players }, { startGame }] = useGame();
    return (
        <>
            <h3>Lobby</h3>
            <ul>
                <li>players: {players.join(', ')}</li>
                <li>latency: {latency}</li>
                <li>time diff: {timeDiff}</li>
            </ul>
            <button onClick={startGame}>start game</button>
        </>
    );
};
