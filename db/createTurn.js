/**
 * MongoDB: Create document
 * Jimp: Create image
 * Printer: Send an image to the printer
 */
const fs = require('fs');
const path = require("path");
const Jimp = require("jimp");
const printer = require('printer');
const moment = require('moment');
const uuid = require('node-uuid');
const cmd = require('node-cmd');

const TurnModel = require('./models/turn');

function ucwords(str) {
    return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
    });
}

const fileName = 'assets/img/BadwingMoto.jpg';
const temporalDirectory = 'assets/delete';
const imageCaption1 = 'Su turno es: ';
const imageCaption2 = 'B i e n v e n i d o';
let loadedImage;
console.log('Supported:', printer.getSupportedPrintFormats())
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

            Jimp.read(fileName)
                .then(function (image) {
                    image.quality(100);
                    loadedImage = image;
                    return Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
                })
                .then(function (font) {
                    const temporalFileName = path.join(temporalDirectory, uuid.v1()) + '.jpg';
                    console.log('Generated image file: temporalFileName:', temporalFileName);
                    loadedImage.print(font, 46, 110, imageCaption2)
                                .write(temporalFileName);
            
                    loadedImage.print(font, 40, 150, `${imageCaption1} ${createdPayload.groupName}${createdPayload.counter}`)
                            .write(temporalFileName);
            
                    moment.locale('es');
                    const date = ucwords(moment(new Date).format("hh:mm:ss A "));
                    //const date = ucwords(moment(new Date).format("dd, MMMM D YYYY, h:mm:ss a"));
                    loadedImage.print(font, 60, 185, date)
                            .write(temporalFileName);
                    // Check if the file exists
                    fs.stat(temporalFileName, function(err, stat) {
                        if(err == null) {
                            cmd.run(`mspaint /pt ${temporalFileName} EC-80330`);
                            // Delete the file after 10 seconds
                            setTimeout(() => {
                                fs.unlink(temporalFileName, (error) => {
                                    console.log(`successfully deleted ${temporalFileName}`);
                                });
                            }, 10000);
                        } else if(err.code == 'ENOENT') {
                            // file does not exist
                            fs.appendFile('log.txt', 'The file '+temporalFileName+' does not exists\n');
                        }
                    });
                    
                    /*printer.printDirect({
                        data: temporalFileName,
                        type: 'JPEG',
                        success: function(jobID){
                            console.log(`sent to printer with ID: ${jobID}`);
                        },
                        error: function(err){
                            console.log(err);
                        }
                    });*/
                })
                .catch(function (err) {
                    console.error(err);
                });
            
            io.sockets.emit('turn-created', createdPayload);
        });
};

module.exports = createTurn;
