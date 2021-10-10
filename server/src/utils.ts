export function shuffle<T>(arr: T[]): T[] {
  const array = [...arr];
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const ORDERED_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
export const compareNotes = (a: string, b: string): number => {
  const octaveA = parseInt(a.slice(-1), 10);
  const octaveB = parseInt(b.slice(-1), 10);
  if (octaveA !== octaveB) {
    return octaveA - octaveB;
  }
  const noteA = ORDERED_NOTES.indexOf(a.slice(0, a.length - 1));
  const noteB = ORDERED_NOTES.indexOf(b.slice(0, b.length - 1));
  return noteA - noteB;
};
