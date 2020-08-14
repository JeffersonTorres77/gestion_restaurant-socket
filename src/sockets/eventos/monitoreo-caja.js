const path = require('path');
const fs = require('fs');
const sqlite = require('./../../sistema/utils/sqlite3');
const mysql = require('./../../sistema/utils/mysql');
const showConsole = require('./../../../config.json').showConsole;

const EmitMonitoreoCamarero = require('./../emits/monitoreo-camarero');
const EmitMonitoreoCaja = require('./../emits/monitoreo-caja');

module.exports = function(io, socket)
{
    /**
     * 
     */
    socket.on('actualizar-todo', async (data) =>
    {
        try
        {
            await EmitMonitoreoCaja.actualizarTodo(io, socket, data);
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
    socket.on('facturar', async (data) =>
    {
        try
        {
            await EmitMonitoreoCaja.facturar(io, socket, data);
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
    socket.on('eliminar-pedido', async (data) =>
    {
        try
        {
            await EmitMonitoreoCaja.eliminarPedido(io, socket, data);
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
    socket.on('quitar-alarma', async (data) =>
    {
        try
        {
            await EmitMonitoreoCaja.QuitarAlarma(io, socket, data);
        }
        catch(err)
        {
            socket.emit('ws:error', err);
            if(showConsole) console.log(err);
        }
    });
}