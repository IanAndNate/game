import styled from "@emotion/styled";
import { TRACK_WIDTH, COLOURS } from "./constants";
import { getPosition } from "./utils";

export const NoteBar = styled("div")`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding-bottom: 12px;
`;

export const Note = styled.span<{
  time: number;
  duration: number;
  note: string;
  index: number;
  speedFactor: number;
}>`
  position: absolute;
  padding: 10px;
  box-sizing: border-box;
  width: ${TRACK_WIDTH}px;
  bottom: ${({ time, speedFactor }) => (time + 3 / speedFactor) * 500}px;
  height: ${({ duration }) => duration * 500}px;
  background-color: ${({ note }) =>
    COLOURS[getPosition(note) % COLOURS.length]};
  left: ${({ note }) => getPosition(note) * (TRACK_WIDTH + 10)}px;
  border-style: solid;
  border-color: black;
  border-width: 5px 1px;
`;

export const UserNote = styled.button<{ note: string; isPressed: boolean }>`
  width: ${TRACK_WIDTH}px;
  height: ${TRACK_WIDTH}px;
  margin-right: 10px;
  background-color: ${({ note }) =>
    COLOURS[getPosition(note) % COLOURS.length]};
  font-size: 25px;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 0 10px black;
  border: 1px solid #000;
  flex-shrink: 0;
  padding: 0;
  box-shadow: 0 0 5px 1px
    ${({ note, isPressed }) =>
      isPressed ? COLOURS[getPosition(note) % COLOURS.length] : "black"};
  filter: brightness(${({ isPressed }) => (isPressed ? "125%" : "75%")});
  user-select: none;
`;
