(function(io, $) {
    'use strict';

    const url = 'http://127.0.0.1:80';
    const options = {
        path: '/turns'
    };
    const socket = io(url, options);
    // Define functions
    function getCurrentTurn(cb) {
        socket.emit('get-turn', {});
        socket.on('current-turn', (payload) => cb(payload));
    }
    function subscribeToCurrentTurn(cb) {
        socket.on('turn-created', (payload) => cb(null, payload));
    }
    // Use callback with functions
    getCurrentTurn(function(payload) {
        console.log('payload:', JSON.stringify(payload));
    });
    subscribeToCurrentTurn(function(err, payload) {
        console.log('currentTurn:', payload);
    });
})(window.io, window.jQuery);
