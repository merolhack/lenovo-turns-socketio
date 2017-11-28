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
const WindowModel  = require('./db/models/window');
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
    // Set the active window
    client.on('update-window-data', (payload) => {
        console.log('update-window-data: payload:', payload);
        WindowModel.findOneAndUpdate({'number': payload.number}, {
            $set: {
                username: payload.username
            }
        }, {
            new: true
        }, function (err, wind0w) {
            if (err) return handleError(err);
            io.emit('active-window-setted', wind0w);
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
        const latest = TurnModel.findOne(query)
            .where("window").ne(null)
            .sort({counter: -1});
        let counter = 0;
        let group = '';
        let wind0w = 0;
        latest.exec((err, documentFound) => {
            if (err) return handleError(err);
            if (documentFound) {
                console.log('documentFound:', documentFound);
                counter = documentFound.counter;
                group = documentFound.group;
                wind0w = documentFound.window;
            }
            io.emit('current-turn', {counter, group, wind0w});
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
    client.on('request-turn', (payload) => {
        console.log('request-turn | payload:', payload);
        // Get the latest turn with no window selected
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'group': payload.windowGroup,
            'window': null,
            'createdAt': {$gte: start, $lt: end}
        };
        TurnModel.findOneAndUpdate(query, {
            $set: {
                window: payload.windowId
            }
        }, {
            new: true
        }, function (err, documentFound) {
            if (err) return handleError(err);
            console.log('request-turn | documentFound:', documentFound);
            io.emit('set-requested-turn', {documentFound});
        });
    });
    client.on('complete-turn', (payload) => {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'counter': payload.counter,
            'window': payload.windowId,
            'group': payload.windowGroup,
            'createdAt': {$gte: start, $lt: end}
        };
        console.log('query:', query);
        TurnModel.findOneAndUpdate(query, {
            $set: {
                completed: true
            }
        }, {
            new: true
        }, function (err, documentFound) {
            if (err) return handleError(err);
            io.emit('turn-completed', {documentFound});
        });
    });
    client.on('get-next-turn', (payload) => {
        // Get the latest turn
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'createdAt': {$gte: start, $lt: end}
        };
        const latests = TurnModel.find(query).where('window').ne(null).sort({counter: -1});
        latests.exec((err, documentsFound) => {
            console.log('get-next-turn | documentsFound:', documentsFound[1]);
            const document = (typeof documentsFound[1] !== "undefined" && documentsFound[1] !== null) ? documentsFound[1] : null;
            io.emit('set-next-turn', {document});
        });
    });
    client.on('get-previous-turn', (payload) => {
        // Get the latest turn
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'createdAt': {$gte: start, $lt: end}
        };
        const latests = TurnModel.find(query).where('window').ne(null).sort({counter: -1});
        latests.exec((err, documentsFound) => {
            console.log('get-previous-turn | documentsFound:', documentsFound[2]);
            const document = (typeof documentsFound[1] !== "undefined" && documentsFound[2] !== null) ? documentsFound[2] : null;
            io.emit('set-previous-turn', {document});
        });
    });
});
