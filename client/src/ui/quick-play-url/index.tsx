import { useEffect } from "react";
import { useHistory } from "react-router";

export const QuickPlayUrl = (): null => {
  const history = useHistory();
  useEffect(() => {
    const quickPlay = async () => {
      const url = window.location.search.substring(1);
      const roomIdResponse = await fetch(
        `/new?${new URLSearchParams({
          url,
          maxKeys: "6",
        }).toString()}`
      );
      const { roomId } = await roomIdResponse.json();
      history.push(`/game/${roomId}`);
    };
    quickPlay();
  }, [history]);
  return null;
};
