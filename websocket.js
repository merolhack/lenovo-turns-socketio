/**
 * WebSocket server
 * 
 * @author Lenin Meza <merolhack@gmail.com>
 */
const port = 80;
// Dependencies
const ip           = require('ip');
const express      = require('express');
const app          = express();
// Database
const db           = require('./db/connection');
const TurnModel    = require('./db/models/turn');
const ButtonModel  = require('./db/models/button');
const createTurn   = require('./db/createTurn');

const handleError = function(error) {
    console.log('error:', error);
};

/**
 * WebServer
 */
const address      = ip.address();
const server       = app.listen(port, function() {
    console.log(`Listening on ${address}:${port}`);
});
app.use(express.static('public'));

/**
 * Socket.IO
 */
let io             = require('socket.io')(server, {
    path: '/turns'
});
// Emitting events to the client
io.on('connection', (client) => {
    console.log('Socket.IO: Client connected');
    // Get the current turn of today
    client.on('get-buttons', () => {
        ButtonModel.find().sort({order: -1}).then((documents) => {
            if(documents.length > 0) {
                io.emit('set-buttons', documents);
            }
        });
    });
    // Get the current turn of today
    client.on('get-turn', () => {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'createdAt': {$gte: start, $lt: end}
        };
        const latest = TurnModel.findOne(query).sort({counter: -1});
        let counter = 0;
        latest.exec((err, documentFound) => {
            if (err) return handleError(err);
            if (documentFound) {
                counter = documentFound.counter;
            }
            io.emit('current-turn', {counter});
        });
    });
    client.on('create-turn', (payload) => {
        console.log('create-turn | payload:', JSON.stringify(payload));
        // Get the latest turn of that group in the current day
        let latestTurn = 1;
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'group': payload.groupName,
            'createdAt': {$gte: start, $lt: end}
        };
        const latest = TurnModel.findOne(query).sort({counter: -1});
        latest.exec((err, documentFound) => {
            console.log('err:', err, 'turn:', documentFound);
            if (err) return handleError(err);
            if (!documentFound) {
                console.log('It is the first turn!');
            } else {
                latestTurn = documentFound.counter + 1;
                console.log('Found turn:', documentFound.counter);
            }
            // Create the turn
            const turn = {
                counter: latestTurn,
                group: payload.groupName,
            };
            console.log('Turn that will be created:', turn);
            createTurn(turn, query, io, payload);
        });
    });
});
