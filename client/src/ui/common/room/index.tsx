import React from "react";
import { Player as PlayerType } from "../../../shared/types";
import styled from "@emotion/styled";

interface Props {
  players: PlayerType[];
  action?: React.ReactNode;
  disabled: boolean;
  children?: React.ReactNode;
}

export const RoomWrapper = styled.div<{ disabled: boolean }>`
  border: 1px solid gray;
  border-radius: 3px;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 50vw;
  max-width: 800px;
  justify-content: space-between;
  padding: 4px;
  margin: 8px 0;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`;
const PlayerList = styled.div`
  min-width: 200px;
  display: flex;
  flex-wrap: wrap;
`;

const Player = styled.span<{
  isCurrent: boolean;
  isPressed: boolean;
  isReady: boolean;
}>`
  border: 1px solid ${(props) => (props.isPressed ? "#b77" : "#7b9")};
  box-sizing: border-box;
  border-radius: 3px;
  background-color: ${(props) => (props.isPressed ? "#fcc" : "#cfd")};
  padding: 4px;
  margin: 4px;
  font-weight: ${(props) => (props.isCurrent ? 800 : undefined)};
  filter: brightness(${({ isReady }) => (isReady ? "100%" : "80%")});
`;
const Action = styled.span`
  padding: 2px;
`;

export const Room = ({ players, disabled, action, children }: Props) => {
  return (
    <RoomWrapper disabled={disabled}>
      <PlayerList>
        {players.map((player) => (
          <Player
            key={player.id}
            isCurrent={player.isCurrent}
            isReady={player.isReady}
            isPressed={player.isPressed}
          >
            {player.name}
          </Player>
        ))}
      </PlayerList>
      {action && <Action>{action}</Action>}
      {children}
    </RoomWrapper>
  );
};
