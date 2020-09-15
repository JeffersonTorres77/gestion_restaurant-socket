const datosIO = require('./utils/datosIO');
const MonitoreoPedidos = require('./monitoreo-pedidos/eventos');
const MonitoreoCamarero = require('./monitoreo-camarero/eventos');
const MonitoreoCaja = require('./monitoreo-caja/eventos');
const CambioCliente = require('./cambio-cliente/eventos');

module.exports = (io) => {
    io.on('connection', async (socket) => {
        try {

            socket.datos = await datosIO(socket);
            /**
             * Salas disponibles:
             *  (*) MonitoreoPedidos
             *  (*) MonitoreoCamarero
             *  (*) MonitoreoCaja
             */
            let sala = socket.datos.accion + socket.datos.objRestaurant.id;
            socket.join(sala);

            switch(socket.datos.accion) {
                case "MonitoreoPedidos":
                    MonitoreoPedidos(io, socket);
                    break;

                case "MonitoreoCamarero":
                    MonitoreoCamarero(io, socket);
                    break;

                case "MonitoreoCaja":
                    MonitoreoCaja(io, socket);
                    break;

                case "CambioCliente":
                    CambioCliente(io, socket);
                    break;

                default:
                    throw "Acción invalida.";
                    break;
            }

        } catch(error) {
            socket.emit('ws:error', error);
            socket.disconnect();
        }
    });
}