/**
 * POST /playlists          - create a new playlist
 * GET /playlists           - list playlists
 * DELETE /playlists/:id    - delete a playlist
 */

import express, { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import yaml from "js-yaml";
import { PlayListInfo } from "../../client/src/shared/types.js";
import { parseMidiUrls } from "./songs.js";
import { PlayList, PlayListSpec } from "./types";

export const playlists: PlayList[] = [];

const loadPlayList = async (spec: PlayListSpec): Promise<PlayList> => {
  const midis = await parseMidiUrls(spec.songs.map((s) => s.url));
  return {
    id: uuidv4(),
    spec,
    songs: spec.songs.map((s) => ({
      ...midis.find((m) => m.fileName === s.url),
      songNames: s.songNames,
    })),
  };
};

// preload some playlists
const PLAYLISTS_PATH = "./midi/playlists";
const initPlayLists = async () => {
  fs.readdirSync(PLAYLISTS_PATH).forEach(async (file) => {
    if (file.endsWith(".json") || file.endsWith(".yaml")) {
      try {
        const spec = fs.readFileSync(`./${PLAYLISTS_PATH}/${file}`, "utf8");
        const list = await loadPlayList(
          file.endsWith("json") ? JSON.parse(spec) : yaml.load(spec)
        );
        console.log(
          "loaded playlist",
          list.spec.name,
          list.songs.length,
          "songs"
        );
        playlists.push(list);
      } catch (err) {
        console.error("Failed to load playlist", file, err);
      }
    }
  });
};
initPlayLists();

export const playlistRouter = Router();

playlistRouter.post("/playlists", express.json(), async (req, res) => {
  const spec = req.body as PlayListSpec;
  try {
    const newList = await loadPlayList(spec);
    playlists.push(newList);
    res.status(201).send(newList.id).end();
  } catch (err) {
    res.status(400).send(`Failed to load playlist: ${err}`);
  }
});

playlistRouter.get("/playlists", (_req, res) => {
  res.send(
    playlists.map<PlayListInfo>((p) => ({
      id: p.id,
      name: p.spec.name,
      songs: p.songs.length,
    }))
  );
});

playlistRouter.delete("/playlists/:playlistId", (req, res) => {
  const idx = playlists.findIndex((p) => p.id === req.params.playlistId);
  if (idx < 0) {
    res.status(404).send("No such playlist ID").end();
    return;
  }
  playlists.splice(idx, 1);
  res.status(204).end();
});
