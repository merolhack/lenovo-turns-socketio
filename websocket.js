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
// Allow ilimited listeners
io.sockets.setMaxListeners(0);
// Emitting events to the client
io.on('connection', (client) => {
    var clientIp = client.request.connection.remoteAddress;
    console.log('Socket.IO: Client connected.' + clientIp);
    /**
     * Mobile App: Get the buttons from the buttons collection
     */
    client.on('get-buttons', () => {
        ButtonModel.find().sort({order: -1}).then((documents) => {
            if(documents.length > 0) {
                io.emit('set-buttons', documents);
            }
        });
    });
    /**
     * Mobile App: Create a turn in the turns collections
     */
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
                window: 0,
            };
            console.log('Turn that will be created:', turn);
            createTurn(turn, query, io, payload);
        });
    });
    /**
     * Window App: Set the active window
     */
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
    /**
     * Window App: Request a turn
     */
    client.on('request-turn', (payload) => {
        console.log('request-turn | payload:', payload);
        // Get the latest turn with no window selected
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'group': payload.windowGroup,
            'window': 0,
            'createdAt': {$gte: start, $lt: end}
        };
        const latests = TurnModel.find(query)
            .where('window').equals(0)
            .where("completed").equals(false)
            .sort({'updatedAt': -1});
        latests.exec((err, documentsFound) => {
            if (err) return handleError(err);
            console.log('request-turn | latests:', documentsFound);
            // Latest
            TurnModel.findByIdAndUpdate(documentsFound[documentsFound.length - 1]._id, {
                    username: payload.windowUsername,
                    window: payload.windowId,
            }, {
                new: true
            }, function (err, documentFound) {
                if (err) return handleError(err);
                console.log('request-turn | documentFound:', documentFound);
                io.emit('set-requested-turn', {documentFound});
            });
        });
    });
    /**
     * Window App: Complete a turn
     */
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
        }, (err, documentFound) => {
            console.log('documentFound:', documentFound);
            io.sockets.emit('turn-completed', {payload: documentFound});
            io.emit('get-next-turn', {});
            io.emit('get-previous-turn', {});
        });
    });
    /**
     * Screen App: Get the latest "uncompleted" turn of today
     */
    client.on('get-turn', (completed) => {
        console.log('get-turn | completed:', completed);
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'createdAt': {$gte: start, $lt: end}
        };
        if (completed === true) {
            query.completed = false;
        }
        const latest = TurnModel.findOne(query)
            .where("window").ne(0)
            .where("completed").equals(false)
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
    /**
     * Screen App: Get the next "completed" turn of today
     */
    client.on('get-next-turn', (payload) => {
        // Get the latest turn
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'createdAt': {$gte: start, $lt: end}
        };
        const latests = TurnModel.find(query)
            .where('window').ne(0)
            .where("completed").equals(true)
            .sort({'updatedAt': -1});
        latests.exec((err, documentsFound) => {
            console.log('get-next-turn | documentsFound:', documentsFound[0]);
            const document = (typeof documentsFound[0] !== "undefined" && documentsFound[0] !== null) ? documentsFound[0] : null;
            io.sockets.emit('set-next-turn', {document});
        });
    });
    /**
     * Screen App: Get the next "completed" turn of today
     */
    client.on('get-previous-turn', (payload) => {
        // Get the latest turn
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        const query = {
            'createdAt': {$gte: start, $lt: end}
        };
        const latests = TurnModel.find(query)
            .where('window').ne(0)
            .where("completed").equals(true)
            .sort({'updatedAt': -1});
        latests.exec((err, documentsFound) => {
            console.log('get-previous-turn | documentsFound:', documentsFound[1]);
            const document = (typeof documentsFound[1] !== "undefined" && documentsFound[1] !== null) ? documentsFound[1] : null;
            io.sockets.emit('set-previous-turn', {document});
        });
    });
});
