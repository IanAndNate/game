import fs from "fs";
import Midi from "@tonejs/midi";
import { parseMidi } from "../songs.js";

const analyseMidi = (fileName: string) => {
  console.log(`Analysing ${fileName}`);
  const data = fs.readFileSync(fileName);
  const song = parseMidi(fileName, new Midi.Midi(data));
  console.log(`  ${song.midiArray.tracks.length} tracks`);
  console.log(`  ${song.uniqueNotes.length} unique notes`);
  console.log(`  ${song.music.length} total notes`);
  console.log(
    `  ${Math.max(...song.music.map((n) => n.time + n.duration))} seconds`
  );
  song.midiArray.tracks.forEach((track, idx) => {
    console.log(`  track ${idx}:`);
    console.log(`    name: ${track.name}`);
    console.log(`    family: ${track.instrument.family}`);
    console.log(`    instrument: ${track.instrument.name}`);
    console.log(`    total notes: ${track.notes.length}`);
    const uniqueNotes = track.notes.filter(
      (value, index, self) =>
        self.findIndex((orig) => orig.name === value.name) === index
    );
    console.log(`    unique notes: ${uniqueNotes.length}`);
  });
};

process.argv.slice(2).forEach(analyseMidi);
