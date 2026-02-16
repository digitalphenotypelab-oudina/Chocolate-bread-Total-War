const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let globalWarScore = { pain: 0, chocolatine: 0 };
let dailyVotes = { pain: 0, chocolatine: 0 };
let lastVotes = {}; // Stocke l'IP + le moment du dernier vote (timestamp)

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.emit('updateScores', { global: globalWarScore, daily: dailyVotes });

    socket.on('vote', (choice) => {
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;

        // Vérification du délai de 5 minutes
        if (lastVotes[ip] && (now - lastVotes[ip] < FIVE_MINUTES)) {
            const remaining = Math.ceil((FIVE_MINUTES - (now - lastVotes[ip])) / 1000);
            socket.emit('tooSoon', remaining);
            return;
        }

        if (dailyVotes[choice] !== undefined) {
            dailyVotes[choice]++;
            lastVotes[ip] = now;
            io.emit('updateScores', { global: globalWarScore, daily: dailyVotes });
            socket.emit('voteSuccess', now);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Guerre intensive lancée !`));
