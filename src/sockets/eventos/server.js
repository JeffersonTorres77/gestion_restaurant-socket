const path = require('path');
const fs = require('fs');
const sqlite = require('./../../sistema/utils/sqlite3');
const mysql = require('./../../sistema/utils/mysql');
const showConsole = require('./../../../config.json').showConsole;

const EmitMonitoreoCocina = require('./../emits/monitoreo-cocina');
const EmitMonitoreoCamarero = require('./../emits/monitoreo-camarero');
const EmitMonitoreoCaja = require('./../emits/monitoreo-caja');

/**
 * 
 * @param {*} io 
 * @param {*} socket 
 */
module.exports = function(io, socket)
{
    socket.on('actualizar-cocina', () => {
        try {
            EmitMonitoreoCocina.cambio(io, socket, []);
            EmitMonitoreoCamarero.cambio(io, socket, []);
            EmitMonitoreoCaja.cambio(io, socket, []);
        } catch(err) {
            socket.emit('ws:error', err);
            if(showConsole) console.log(err);
        }
    });
}