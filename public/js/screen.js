(function(io, $, swal, _) {
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
        function getLatestTurn(cb) {
            socket.emit('get-latests-turns', {});
            socket.on('set-latests-turns', (payload) => cb(payload));
        }
        function getTurnCompleted(cb) {
            socket.on('turn-completed', (payload) => cb(payload));
        };
        // Update the table with the latest turn
        function updateTable(payload) {
            $('#historial tbody').empty();
            console.log('updateTable | payload:', payload);
            _.each(payload.documentsFound, function(element, index) {
                const historyTurn = element.group+''+element.counter;
                $('#historial tbody').append('<tr>\
                    <td><span class="codigos">'+historyTurn+'</span></td>\
                    <td width="70%" class="modulo">Módulo: <span>'+element.window+'</span></td>\
                </tr>'); 
            });
            $.playSound('/audio/beep-07.wav');
        };
        // Use callback with functions
        getCurrentTurn(function(payload) {
            console.log('payload:', JSON.stringify(payload));
            $('.turno-activo-codigo').text(payload.group + '' + payload.counter);
            $('.turno-activo-modulo span').text(payload.wind0w);
            getLatestTurn(function(latestPayload) {
                console.log('latestPayload:', latestPayload);
                updateTable(latestPayload);
            });
            $.playSound('/audio/beep-07.wav');
        });
        subscribeToCurrentTurn(function(err, payload) {
            console.log('currentTurn:', payload);
            getLatestTurn(function(latestPayload) {
                updateTable(latestPayload);
            });
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
                }
            }
        });
        getTurnCompleted(function(payload) {
            console.log('setTurnCompleted:', payload);
            socket.emit('get-turn', {});
            getLatestTurn(function(latestPayload) {
                updateTable(latestPayload);
            });
        });
    });
})(window.io, window.jQuery, window.swal, window._);
