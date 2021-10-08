import React, { useCallback, useEffect, useState } from "react";
import { RoomInfo } from "../../../shared/types";
import styled from "@emotion/styled";
import { useCreateAndJoinRoom } from "../../../controllers/game";
import { Room, RoomWrapper } from "../../common/room";
import { GameMode } from "../../../controllers/game/types";

const Wrapper = styled.div`
    button,
    select {
        margin-right: 8px;
    }
`;

export const Rooms = () => {
    const newGame = useCreateAndJoinRoom();
    const [rooms, setRooms] = useState<RoomInfo[] | null>(null);
    const [mode, setMode] = useState<GameMode>(GameMode.Standard);
    const fetchRooms = useCallback(async () => {
        setRooms(null);
        const response = await fetch("/rooms");
        setRooms(await response.json());
    }, []);
    useEffect(() => {
        fetchRooms();
    }, []);
    const updateMode = useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            setMode(ev.target.value as GameMode);
        },
        []
    );
    if (rooms === null) {
        return (
            <Wrapper>
                <RoomWrapper disabled>Loading...</RoomWrapper>
            </Wrapper>
        );
    }

    const controls = (
        <>
            <select onChange={updateMode} value={mode}>
                <option value={GameMode.Standard}>play uploaded songs</option>
                <option value={GameMode.BitMidi}>
                    play a random bitmidi.com song
                </option>
                <option value={GameMode.BitMidi5}>
                    play 5 random bitmidi.com songs
                </option>
            </select>
            <button onClick={() => newGame(mode)}>New game</button>
            <button onClick={fetchRooms}>Refresh</button>
        </>
    );

    if (rooms.length === 0) {
        return (
            <Wrapper>
                <RoomWrapper disabled>No games found</RoomWrapper>
                {controls}
            </Wrapper>
        );
    }
    return (
        <Wrapper>
            {rooms.map(({ roomId, currentRound, totalRounds, players }) => (
                <Room
                    key={roomId}
                    players={players}
                    disabled={false}
                    action={
                        <a href={`/game/${roomId}`}>
                            join game (
                            {currentRound < 0
                                ? "new game"
                                : `round ${currentRound + 1}/${totalRounds}`}
                            )
                        </a>
                    }
                />
            ))}
            {controls}
        </Wrapper>
    );
};
