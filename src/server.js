import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

app.use(express.static(`src/static`));
app.use(express.static(`node_modules`));

const server = createServer(app);
const io = new Server(server);

server.listen(443, () => {
    console.log('listening on *:443');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
