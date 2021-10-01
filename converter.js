import Midi from '@tonejs/midi'
import { readFile, writeFile } from 'fs/promises';

// load a midi file in the browser
console.log(Midi);

readFile('midi/amazgrac04.mid').then((buffer) => {
    const midi = new Midi.Midi(buffer);
    console.log(midi);

    writeFile('midi/amazgrac04.json', JSON.stringify(midi));
});

readFile('midi/2289444_1.mid').then((buffer) => {
    const midi = new Midi.Midi(buffer);
    console.log(midi);

    writeFile('midi/2289444_1.json', JSON.stringify(midi));
});

readFile('midi/tetris.mid').then((buffer) => {
    const midi = new Midi.Midi(buffer);
    console.log(midi);

    writeFile('midi/tetris.json', JSON.stringify(midi));
});
