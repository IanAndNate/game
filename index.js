import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

const log = (entry) => {
    fs.appendFileSync('/tmp/sample-app.log', new Date().toISOString() + ' - ' + entry + '\n');
};

const app = express();

app.use(express.static(`static`));

const index = createServer(app);
const io = new Server(index);

const port = process.env.PORT || 3000;

index.listen(port, () => {
    log(`listening on *:${port}`);
});

io.on('connection', (socket) => {
    log('a user connected');
    socket.on('disconnect', () => {
        log('user disconnected');
    });
});
