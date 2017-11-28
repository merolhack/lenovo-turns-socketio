(function(io, $, swal) {
    'use strict';

    /**
     * Set the initial values of the turns
     */
    // Current turn
    $('.turno-activo-codigo').text(0);
    $('.turno-activo-modulo span').text(0);
    // Next turn
    $('.turno-siguiente .codigo').text(0);
    $('.turno-siguiente .modulo span').text(0);
    // Previous turn
    $('.turno-anterior .codigo').text(0);
    $('.turno-anterior .modulo span').text(0);

    swal({
        text: 'Ingrese la IP del panel de control:',
        content: {
            element: "input",
            attributes: {
                placeholder: "Ingrese la IP",
                type: "text",
                value: "192.168.1.134"
            },
        },
        button: {
            text: "Guardar",
            closeModal: true,
        },
    })
    .then(function(ip) {
        const url = 'http://'+ ip +':80';
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
        function getNextTurn(cb) {
            socket.emit('get-next-turn', {});
            socket.on('set-next-turn', (payload) => cb(payload));
        }
        function getPreviousTurn(cb) {
            socket.emit('get-previous-turn', {});
            socket.on('set-previous-turn', (payload) => cb(payload));
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
        getNextTurn(function(err, payload) {
            console.log('getNextTurn:', payload);
        });
        getPreviousTurn(function(err, payload) {
            console.log('getPreviousTurn:', payload);
        });
    });
})(window.io, window.jQuery, window.swal);
