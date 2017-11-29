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
                value: "192.168.1.87"
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
            socket.emit('get-turn', {completed: true});
            socket.on('current-turn', (payload) => cb(payload));
        }
        function subscribeToCurrentTurn(cb) {
            socket.on('set-requested-turn', (payload) => cb(null, payload));
        }
        function getNextTurn(cb) {
            socket.emit('get-next-turn', {});
            socket.on('set-next-turn', (payload) => cb(payload));
        }
        function getPreviousTurn(cb) {
            socket.emit('get-previous-turn', {});
            socket.on('set-previous-turn', (payload) => cb(payload));
        }
        function getTurnCompleted(cb) {
            socket.on('turn-completed', (payload) => cb(payload));
        };
        // Use callback with functions
        getCurrentTurn(function(payload) {
            console.log('payload:', JSON.stringify(payload));
            $('.turno-activo-codigo').text(payload.group + '' + payload.counter);
            $('.turno-activo-modulo span').text(payload.wind0w);
            var sound = document.getElementById("audio");
            sound.play();
        });
        subscribeToCurrentTurn(function(err, payload) {
            console.log('currentTurn:', payload);
            if (payload.documentFound === null) {
                $('.turno-activo-codigo').text('');
                $('.turno-activo-modulo span').text('');
            } else {
                // Get the current text
                const currentTurn = $('.turno-activo-codigo').text();
                const currentModule = $('.turno-activo-modulo span').text();
                if (
                    payload.documentFound.group + ' ' + payload.documentFound.counter !== currentTurn
                    &&
                    payload.documentFound.window !== currentModule
                ) {
                    $('.turno-activo-codigo').text(payload.documentFound.group + ' ' + payload.documentFound.counter);
                    $('.turno-activo-modulo span').text(payload.documentFound.window);
                    var sound = document.getElementById("audio");
                    sound.play();
                }
            }
        });
        getNextTurn(function(payload) {
            console.log('getNextTurn:', payload);
            if (typeof payload !== "undefined" && payload.document !== null) {
                $('.turno-siguiente .codigo').text(payload.document.group + ' ' + payload.document.counter);
                $('.turno-siguiente .modulo span').text(payload.document.window);
            } else {
                $('.turno-siguiente .codigo').text('');
                $('.turno-siguiente .modulo span').text('');
            }
        });
        getPreviousTurn(function(payload) {
            console.log('getPreviousTurn:', payload);
            if (typeof payload !== "undefined" && payload.document !== null) {
                $('.turno-anterior .codigo').text(payload.document.group + ' ' + payload.document.counter);
                $('.turno-anterior .modulo span').text(payload.document.window);
            } else {
                $('.turno-anterior .codigo').text('');
                $('.turno-anterior .modulo span').text('');
            }
        });
        getTurnCompleted(function(payload) {
            console.log('setTurnCompleted:', payload);
            socket.emit('get-turn', {});
            socket.emit('get-next-turn', {});
            socket.emit('get-previous-turn', {});
        });
    });
})(window.io, window.jQuery, window.swal);
