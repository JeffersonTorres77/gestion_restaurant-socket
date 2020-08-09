const path = require('path');
const fs = require('fs');
const sqlite = require('./../../sistema/utils/sqlite3');
const mysql = require('./../../sistema/utils/mysql');
const showConsole = require('./../../../config.json').showConsole;

const EmitMonitoreoCocina = require('./../emits/monitoreo-cocina');

/**
 * 
 * @param {*} io 
 * @param {*} socket 
 */
module.exports = function(io, socket)
{
    /**
     * 
     */
    socket.on('actualizar-todo', async (data) =>
    {
        try
        {
            await EmitMonitoreoCocina.actualizarTodo(io, socket, data);
        }
        catch(err)
        {
            socket.emit('ws:error', err);
            if(showConsole) console.log(err);
        }
    });

    /**
     * 
     */
    socket.on('entrega', async (data) =>
    {
        try
        {
            await EmitMonitoreoCocina.entrega(io, socket, data);
        }
        catch(err)
        {
            socket.emit('ws:error', err);
            if(showConsole) console.log(err);
        }
    });
}