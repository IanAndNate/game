let nextPosition = 0;

const NOTE_POSITIONS: { [note: string]: number } = {};

export const getPosition = (note: string) => {
  const existing = NOTE_POSITIONS[note];
  if (typeof existing !== "undefined") {
    return existing;
  }
  NOTE_POSITIONS[note] = nextPosition;
  nextPosition++;
  return NOTE_POSITIONS[note];
};
