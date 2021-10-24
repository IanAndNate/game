import fs from "fs";
import Midi from "@tonejs/midi";
import { Note } from "@tonejs/midi/dist/Note";

interface Filter {
  start: number;
  end: number;
  removeTracks: number[];
}

const filter: Filter = {
  start: 0,
  end: Infinity,
  removeTracks: [],
};

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(
    "usage: node modify_tracks.js [--remove-track <track index>] [--start <seconds>] [--end <seconds>] input.mid"
  );
}

while (args.length && args[0].startsWith("--")) {
  const flag = args.shift();
  if (flag === "--remove-track") {
    filter.removeTracks.push(parseInt(args.shift(), 10));
  } else if (flag === "--start") {
    filter.start = parseFloat(args.shift());
  } else if (flag === "--end") {
    filter.start = parseFloat(args.shift());
  } else {
    console.log("unknown flag", flag);
    process.exit(1);
  }
}

const modifyMidi = (fileName: string) => {
  console.log(`Modifying ${fileName}`);
  const data = fs.readFileSync(fileName);
  const midi = new Midi.Midi(data);
  midi.tracks = midi.tracks
    // handle --remove-track
    .filter((_, idx) => !filter.removeTracks.includes(idx))
    // handle --start and --end
    .map<Midi.Track>((track) => {
      track.notes = track.notes.reduce<Note[]>((notes, note) => {
        if (
          note.time >= filter.start &&
          note.time + note.duration <= filter.end
        ) {
          note.time -= filter.start;
          notes.push(note);
        }
        return notes;
      }, []);
      return track;
    });
  fs.writeFileSync(
    `${fileName.replace(".mid", ".modified.mid")}`,
    Buffer.from(midi.toArray())
  );
};

args.forEach(modifyMidi);
