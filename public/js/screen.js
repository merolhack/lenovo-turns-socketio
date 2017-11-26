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
        $('div.turno-activo span.turno-activo-codigo').text(payload.group + '' + payload.counter);
        $('div.turno-activo span.turno-activo-modulo span').text(payload.wind0w);
        var sound = document.getElementById("audio");
        sound.play();
    });
    subscribeToCurrentTurn(function(err, payload) {
        console.log('currentTurn:', payload);
        $('div.turno-siguiente span.codigo').text(payload.groupName + '' + payload.counter);
    });
})(window.io, window.jQuery);
