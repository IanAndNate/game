import fetch from "node-fetch";
import { Song } from "./types";
import { parseMidiUrl } from "./songs.js";

const API = "https://bitmidi.com/api/midi/all";

interface BitMidiResult {
  id: number;
  name: string;
  slug: string;
  alternateNames?: string[];
  url: string;
  downloadUrl: string;
}

interface BitMidiSearchResponse {
  result: {
    results: BitMidiResult[];
  };
}

// eslint-disable-next-line import/prefer-default-export
export const getRandomBitMidiSong = async (
  searchRange: number
): Promise<Song> => {
  const response = await fetch(
    `${API}?${new URLSearchParams({
      orderBy: "plays",
      pageSize: "1",
      page: String(Math.floor(Math.random() * searchRange) + 1),
    }).toString()}`
  );
  const result = ((await response.json()) as BitMidiSearchResponse).result
    .results[0];
  const sanitiseName = (s: string) =>
    s
      .toLowerCase()
      .replace(/\d*.mid$/i, "")
      .replace(/[-_\s]+/g, " ")
      .trim();
  return {
    ...(await parseMidiUrl(new URL(result.downloadUrl, API).toString())),
    songNames: [result.name, ...(result.alternateNames || [])].map(
      sanitiseName
    ),
  };
};
