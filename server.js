const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Scores historiques (les points gagnés jour après jour)
let globalWarScore = { pain: 0, chocolatine: 0 };
// Votes de la journée en cours
let dailyVotes = { pain: 0, chocolatine: 0 };
let voters = {}; 

app.use(express.static('public'));

// Logique de minuit : On donne le point au gagnant du jour
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        if (dailyVotes.pain > dailyVotes.dailyVotes.chocolatine) {
            globalWarScore.pain++;
        } else if (dailyVotes.chocolatine > dailyVotes.pain) {
            globalWarScore.chocolatine++;
        }
        // Reset pour la nouvelle journée
        dailyVotes = { pain: 0, chocolatine: 0 };
        voters = {};
        io.emit('updateScores', { global: globalWarScore, daily: dailyVotes });
    }
}, 60000); // Vérifie chaque minute

io.on('connection', (socket) => {
    socket.emit('updateScores', { global: globalWarScore, daily: dailyVotes });

    socket.on('vote', (choice) => {
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;
        const today = new Date().toDateString();

        if (voters[ip] === today) {
            socket.emit('alreadyVoted');
            return;
        }

        if (dailyVotes[choice] !== undefined) {
            dailyVotes[choice]++;
            voters[ip] = today;
            io.emit('updateScores', { global: globalWarScore, daily: dailyVotes });
            socket.emit('voteSuccess');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Guerre totale active sur le port ${PORT}`));
