import React from "react";
import { useGame } from "../../../controllers/game";
import { Room } from "../../common/room";

export const Lobby = () => {
    const [{ latency, timeDiff, players }, { startGame }] = useGame();
    return (
        <>
            <h2>Lobby</h2>
            <Room players={players} disabled={false} />
            <ul>
                <li>latency: {latency}</li>
                <li>time diff: {timeDiff}</li>
            </ul>
            <button onClick={startGame}>start game</button>
        </>
    );
};
