const queryio = require('./utils/query.io');
const showConsole = require('./../../config.json').showConsole;

const monitoreoCocina = require('./eventos/monitoreo-pedidos');
const monitoreoCamarero = require('./eventos/monitoreo-camarero');
const monitoreoCaja = require('./eventos/monitoreo-caja');
const serverClientIO = require('./eventos/server');

module.exports = function(io)
{
    io.on('connection', (socket) =>
    {
        // Datos del cliente
        socket.datos = {};

        if(socket.handshake.query.area == "SERVER")
        {
            socket.datos.area = socket.handshake.query.area;
            socket.datos.idRestaurant = socket.handshake.query.idRestaurant;
            socket.datos.idUsuario = socket.handshake.query.idUsuario;
            socket.datos.ip = socket.handshake.query.ip;
        }
        else
        {
            try { socket.datos = queryio( socket.handshake.query ); } catch(err)
            {
                socket.emit('ws:error', err);
                if(showConsole) console.log(err);
                return;
            }
        }

        // Asignamos la sala
        if(socket.datos.area == "GESTION")
        {
            let sala = `${socket.datos.modulo}-${socket.datos.archivo}-${socket.datos.idRestaurant}`;
            let clasificacion = `${socket.datos.modulo}-${socket.datos.archivo}`;
            socket.join(sala);

            if(clasificacion == "monitoreo-pedidos")
            {
                monitoreoCocina(io, socket);
            }
            else if(clasificacion == "monitoreo-camarero")
            {
                monitoreoCamarero(io, socket);
            }
            else if(clasificacion == "monitoreo-caja")
            {
                monitoreoCaja(io, socket);
            }
        }
        else if(socket.datos.area == "SERVER")
        {
            serverClientIO(io, socket);
        }
        else
        {
            socket.emit('ws:error', 'Area invalida.');
            socket.disconnect();
            return;
        }
    });
}