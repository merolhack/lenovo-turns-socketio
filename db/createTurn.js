/**
 * MongoDB Create document
 */
const printer = require('printer');
const moment = require('moment');
const TurnModel = require('./models/turn');

function ucwords(str) {
    return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
    });
}

const createTurn = (turn, query, io, payload) => {
    TurnModel.create(turn)
        .then(() => {
            return TurnModel.findOne(query).sort({counter: -1});
        })
        .then((document) => {
            console.log('Document:', document);
            let createdPayload = payload;
            createdPayload.counter = document.counter;
            console.log('createdPayload:', createdPayload);
            moment.locale('es');
            const date = ucwords(moment(document.createdAt).format("dddd, MMMM D YYYY, h:mm:ss a"));
            const space = '                                                                                                                      ';
            const text = `${space} Su turno es: ${createdPayload.groupName}${createdPayload.counter} ${space} ${date} ${space} ${space} ${space} `;
            printer.printDirect({
                data: text, // or simple String: "some text"
                //printer:'Foxit Reader PDF Printer', // printer name, if missing then will print to default printer
                type: 'TEXT', // type: RAW, TEXT, PDF, JPEG, .. depends on platform
                success: function(jobID){
                    console.log(`sent to printer with ID: ${jobID}`);
                },
                error: function(err){
                    console.log(err);
                }
            });
            io.sockets.emit('turn-created', createdPayload);
        });
};

module.exports = createTurn;
