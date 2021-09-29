import Midi from '@tonejs/midi'
import { readFile, writeFile } from 'fs/promises';

// load a midi file in the browser
console.log(Midi);

readFile('pirates.mid').then((buffer) => {
    const midi = new Midi.Midi(buffer);
    console.log(midi);

    writeFile('pirates.json', JSON.stringify(midi));
});
