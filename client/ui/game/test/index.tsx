import React, { useEffect } from "react";
import { useGame } from "../../../controllers/game";
import { GameStatus } from "../../../controllers/game/types";
import { Song } from "./song";

// simple test that loads a song
export const Test = () => {
    const [{ status, piece }, { joinRoom, startGame }] = useGame();
    useEffect(() => {
        if (status === GameStatus.Lobby) {
            startGame({ speedFactor: 1 });
        }
    }, [status]);
    useEffect(() => {
        const makeRoom = async () => {
            const roomIdResponse = await fetch("/new");
            const { roomId } = await roomIdResponse.json();
            joinRoom(roomId);
        };
        makeRoom();
    }, []);
    return <Song />;
};
