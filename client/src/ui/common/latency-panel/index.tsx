import React from "react";
import styled from "@emotion/styled";
import { useGame } from "../../../controllers/game";

const Panel = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0.5;
  font-size: x-small;
  text-align: right;
  padding: 4px;
`;

export const LatencyPanel = () => {
  const [
    {
      latency,
      timeDiff: { diff },
    },
  ] = useGame();
  if (latency === undefined) {
    return null;
  }
  return (
    <Panel>
      <div>latency: {latency}ms</div>
      <div>time diff: {diff}ms</div>
    </Panel>
  );
};
