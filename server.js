const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Base de données simplifiée en mémoire
let scores = { pain: 0, chocolatine: 0 };
let voters = {}; // Stocke l'IP + la date du dernier vote

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Envoie les scores actuels à la connexion
    socket.emit('updateScores', scores);

    socket.on('vote', (choice) => {
        // Récupération de l'IP (gestion proxy pour Render)
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;
        const today = new Date().toDateString();

        if (voters[ip] === today) {
            socket.emit('alreadyVoted', "Tu as déjà combattu aujourd'hui, soldat !");
            return;
        }

        // Enregistrement du vote
        if (choice === 'pain' || choice === 'chocolatine') {
            scores[choice]++;
            voters[ip] = today;
            io.emit('updateScores', scores);
            socket.emit('voteSuccess');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Guerre déclarée sur le port ${PORT}`));
