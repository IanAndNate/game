import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

const app = express();

app.use(express.static(`static`));

const index = createServer(app);
const io = new Server(index);

const port = process.env.PORT || 3000;

index.listen(port, () => {
    console.log(`listening on *:${port}`);
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('keydown', (msg) => {
        console.log('message: ' + msg);
        socket.emit('keydown broadcast', msg);
    });

    socket.on('keyup', (msg) => {
        console.log('message: ' + msg);
        socket.emit('keyup broadcast', msg);
    });
});
