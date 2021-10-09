import React from "react";
import styled from "@emotion/styled";
import { Rooms } from "./rooms";

const Wrapper = styled.div`
  font-family: sans-serif;
  font-size: small;
`;

export const Welcome = () => {
  return (
    <Wrapper>
      <h2>Welcome to the untitled music game</h2>
      <Rooms />
    </Wrapper>
  );
};
