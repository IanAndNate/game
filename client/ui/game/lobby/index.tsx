import React, { useCallback, useState } from "react";
import { useGame, useKeyboard } from "../../../controllers/game";
import { Room } from "../../common/room";

export const Lobby = () => {
    const [{ latency, timeDiff, players }, { startGame }] = useGame();
    const [speed, setSpeed] = useState<number>(1);
    useKeyboard(); // just for fun, let people play notes while waiting
    const start = useCallback(() => {
        startGame({ speedFactor: 1/speed });
    }, [speed]);
    const updateSpeed = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSpeed(parseFloat(e.target.value));        
    }, []);
    return (
        <>
            <h2>Lobby</h2>
            <Room players={players} disabled={false} />
            <ul>
                <li>latency: {latency}</li>
                <li>time diff: {timeDiff}</li>
            </ul>
            <select onChange={updateSpeed} value={speed}>
                <option value={0.1}>10% speed</option>
                <option value={0.25}>25% speed</option>
                <option value={0.5}>50% speed</option>
                <option value={0.75}>75% speed</option>
                <option value={1}>normal speed</option>
            </select>
            <button onClick={start}>start game</button>
        </>
    );
};
