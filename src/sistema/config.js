const config = require('./../../config.json');
const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.File({ filename: 'reporte.log' })
    ]
});

ValidarConfig();

module.exports = {
    BaseDatos: config.BaseDatos,
    Sockets: config.Sockets,
    showConsole: config.showConsole,
    version: config.version,
    urlWS: config.urlWS,

    Escribir: (msj) => {
        Escribir(msj);
    }
}

function ValidarConfig()
{
    try
    {
        if(config.BaseDatos == undefined) throw "Falta 'BaseDatos: object'";
        if(config.BaseDatos.server == undefined) throw "Falta 'BaseDatos.server: string'";
        if(config.BaseDatos.port == undefined) throw "Falta 'BaseDatos.port: int'";
        if(config.BaseDatos.user == undefined) throw "Falta 'BaseDatos.user: string'";
        if(config.BaseDatos.password == undefined) throw "Falta 'BaseDatos.password: string'";
        if(config.BaseDatos.database == undefined) throw "Falta 'BaseDatos.database: string'";
        
        if(config.Sockets == undefined) throw "Falta 'Sockets: object'";
        if(config.Sockets.port == undefined) throw "Falta 'Sockets.port: int'";
        
        if(config.showConsole == undefined) throw "Falta 'showConsole: boolean'";
        if(config.version == undefined) throw "Falta 'version: string'";
        if(config.urlWS == undefined) throw "Falta 'urlWS: string'";
    }
    catch(msjError)
    {
        Escribir(`Config.json - ${msjError}`);
    }
}

function Escribir(msj, type = "info")
{
    type = type.toLowerCase();
    let moment = require('moment');
    let fecha = moment().format("YYYY-MM-DD hh-mm-ss");
    
    if(config.showConsole) {
        console.log(`[${type}][${fecha}]`, msj);
    }

    logger.info({
        date: fecha,
        level: type,
        message: msj
    });
}