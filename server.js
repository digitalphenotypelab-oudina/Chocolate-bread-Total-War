const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Score unique et permanent (tant que le serveur tourne)
let globalScores = { pain: 0, chocolatine: 0 };
let lastVotes = {}; 

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Envoie le score actuel dès que quelqu'un arrive
    socket.emit('updateScores', globalScores);

    socket.on('vote', (choice) => {
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;

        // Limite de 5 minutes par IP
        if (lastVotes[ip] && (now - lastVotes[ip] < FIVE_MINUTES)) {
            const remaining = Math.ceil((FIVE_MINUTES - (now - lastVotes[ip])) / 1000);
            socket.emit('tooSoon', remaining);
            return;
        }

        if (globalScores[choice] !== undefined) {
            globalScores[choice]++; // On ajoute directement au total
            lastVotes[ip] = now;
            
            // On renvoie le nouveau score à TOUT LE MONDE en temps réel
            io.emit('updateScores', globalScores);
            socket.emit('voteSuccess', now);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Guerre Totale en direct sur le port ${PORT}`));
