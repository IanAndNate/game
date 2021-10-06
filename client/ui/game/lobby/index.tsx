import React, { useCallback, useState } from "react";
import { useGame, useKeyboard } from "../../../controllers/game";
import { LatencyPanel } from "../../common/latency-panel";
import { Room } from "../../common/room";
import styled from '@emotion/styled';
import { NoteBar, UserNote } from "../../common/note/styled";
import { KEYBOARD_KEYS } from "../../common/note/constants";

const Wrapper = styled.div`
    select {
        margin-right: 8px;
    }
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
`;

export const Lobby = () => {
    const [{ players, keysDown }, { startGame, mouseDown, mouseUp }] = useGame();
    const [speed, setSpeed] = useState<number>(1);
    useKeyboard(); // just for fun, let people play notes while waiting
    const start = useCallback(() => {
        startGame({ speedFactor: 1/speed });
    }, [speed]);
    const updateSpeed = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSpeed(parseFloat(e.target.value));        
    }, []);
    return (
        <Wrapper>
            <div>
                <h2>Lobby</h2>
                <Room players={players} disabled={false} />
                <select onChange={updateSpeed} value={speed}>
                    <option value={0.1}>10% speed</option>
                    <option value={0.25}>25% speed</option>
                    <option value={0.5}>50% speed</option>
                    <option value={0.75}>75% speed</option>
                    <option value={1}>normal speed</option>
                </select>
                <button onClick={start}>start game</button>
                <LatencyPanel/>
            </div>
            <NoteBar>
            {KEYBOARD_KEYS.map((key, i) =>
                <UserNote note={key} value={key} onPointerDown={mouseDown} onPointerUp={mouseUp}
                          key={i} isPressed={keysDown.has(key)}>{key}</UserNote>
            )}
            </NoteBar>
        </Wrapper>
    );
};
