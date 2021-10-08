import React, { useCallback, useEffect, useState } from "react";
import { RoomInfo } from "../../../shared/types";
import styled from "@emotion/styled";
import { useCreateAndJoinRoom } from "../../../controllers/game";
import { Room, RoomWrapper } from "../../common/room";

const Wrapper = styled.div`
    button {
        margin-right: 8px;
    }
`;

export const Rooms = () => {
    const newGame = useCreateAndJoinRoom();
    const [rooms, setRooms] = useState<RoomInfo[] | null>(null);
    const fetchRooms = useCallback(async () => {
        setRooms(null);
        const response = await fetch("/rooms");
        setRooms(await response.json());
    }, []);
    useEffect(() => {
        fetchRooms();
    }, []);
    if (rooms === null) {
        return (
            <Wrapper>
                <RoomWrapper disabled>Loading...</RoomWrapper>
            </Wrapper>
        );
    }
    if (rooms.length === 0) {
        return (
            <Wrapper>
                <RoomWrapper disabled>No games found</RoomWrapper>
                <button onClick={newGame}>New game</button>
            <button onClick={fetchRooms}>Refresh</button>

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
                        <a href={`/game/${roomId}`}>join game ({currentRound < 0 ? 'new game' : `round ${currentRound + 1}/${totalRounds}`})</a>
                    }
                />
            ))}
            <button onClick={newGame}>New game</button>
            <button onClick={fetchRooms}>Refresh</button>
        </Wrapper>
    );
};
