const fs = require('fs');
const path = require('path');
const showConsole = require('./../../../config.json').showConsole;
const sqlite = require('./../../sistema/utils/sqlite3');
const mysql = require('./../../sistema/utils/mysql');

const EmitMonitoreoCocina = require('./../emits/monitoreo-pedidos');
const EmitMonitoreoCamarero = require('./../emits/monitoreo-camarero');
const EmitMonitoreoCaja = require('./../emits/monitoreo-caja');

const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const UsuarioModel = require('./../../sistema/modelos/usuarios/especifico.js');
const RolModel = require('./../../sistema/modelos/roles/especifico');
const PedidosModel = require('./../../sistema/modelos/pedidos/general');

/**
 * 
 * @param {*} io 
 * @param {*} socket 
 */
module.exports = function(io, socket)
{
    /**
     * Notificar a todos
     */
    socket.on('actualizar-pedidos', () => {
        try {
            EmitMonitoreoCocina.cambio(io, socket, []);
            EmitMonitoreoCamarero.cambio(io, socket, []);
            EmitMonitoreoCaja.cambio(io, socket, []);
        } catch(err) {
            socket.emit('ws:error', err);
            if(showConsole) console.log(err);
        }
    });

    /**
     * Activar el servicio de mesas
     */
    socket.on('activar-servicio', async (data) => {
        let conn = null;
        let bd = null;

        try
        {
            conn = new mysql();
            conn.conectar();

            let usuario = new UsuarioModel(conn);
            await usuario.iniciar( socket.datos.idUsuario );

            let rol = new RolModel(conn);
            await rol.iniciar( usuario.idRol );

            let restaurant = new RestaurantModel(conn);
            await restaurant.iniciar( usuario.idRestaurant );
            
            if(rol.responsable == false) {
                return;
            }

            let pathEstructura = path.join(__dirname, '..', '..', '..', 'database', 'estructura.txt');
            let content = fs.readFileSync(pathEstructura).toString();
            let queryArray = content.split(";");

            let pathDatabase = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${restaurant.id}.db`);
            if(fs.existsSync(pathDatabase)) fs.unlinkSync(pathDatabase);
            bd = new sqlite(pathDatabase);

            for(let query of queryArray)
            {
                bd.ejecutar(query)
            }

            bd.desconectar();
            await restaurant.setServicio(true);

            let idRestaurant = socket.datos.idRestaurant;
            io.in(`monitoreo-pedidos-${idRestaurant}`).emit('cambio');
            io.in(`monitoreo-camarero-${idRestaurant}`).emit('cambio');
            io.in(`monitoreo-caja-${idRestaurant}`).emit('cambio');

            socket.emit('ws:ok', 'Ok');
        }
        catch(err)
        {
            socket.emit('ws:error', err);
            if(showConsole) console.error(err);
        }
    });
    
    /**
     * Desactivar el servicio de mesas
     */
    socket.on('desactivar-servicio', async (data) => {
        let conn = null;

        try
        {
            /**
             * 
             */
            conn = new mysql();
            conn.conectar();

            /**
             * 
             */
            let usuario = new UsuarioModel(conn);
            await usuario.iniciar( socket.datos.idUsuario );

            let rol = new RolModel(conn);
            await rol.iniciar( usuario.idRol );

            let restaurant = new RestaurantModel(conn);
            await restaurant.iniciar( usuario.idRestaurant );

            if(rol.responsable == false) {
                //socket.emit('error', 'Usted no tiene permisos para desactivar el servicio de mesas.');
                return;
            }

            let pathDatabase = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${restaurant.id}.db`);
            if(fs.existsSync(pathDatabase))
            {
                let connSqlite = new sqlite(pathDatabase);
                try
                {
                    let pedidos = await PedidosModel.listado(connSqlite, `status <> '0'`);
                    if(pedidos.length > 0)
                    {
                        socket.emit('ws:error', 'Finalice los pedidos activos antes de cerrar el servicio de mesas.');
                        connSqlite.desconectar();
                    }
                    else
                    {
                        connSqlite.desconectar();
                        BorrarBD(socket, pathDatabase);
                        await restaurant.setServicio(false);
                        NotificarATodos(io, socket, 'ws:error', 'Servicio de mesas cerrado.');
                    }
                }
                catch(err)
                {
                    socket.emit('ws.error', 'Test');
                    connSqlite.desconectar();
                    BorrarBD(socket, pathDatabase);
                    await restaurant.setServicio(false);
                    NotificarATodos(io, socket, 'ws:error', 'Servicio de mesas cerrado.');
                }
            }
            else
            {
                await restaurant.setServicio(false);
                NotificarATodos(io, socket, 'ws:error', 'Servicio de mesas cerrado.');
            }

            conn.desconectar();
        }
        catch(err)
        {
            socket.emit('ws:error', err);
            if(showConsole) console.error(err);
        }
    });
}

/**
 * 
 * @param {*} path 
 */
function BorrarBD(socket, path)
{
    try
    {
        if(fs.existsSync(path)) {
            fs.writeFileSync(path, "");
            fs.unlinkSync(path);
        }
    }
    catch(error)
    {
        socket.emit('ws:error', 'Ocurrio un error al intentar borrar la base de datos temporal, intentelo en un par de minutos.');
    }
}

/**
 * 
 * @param {*} io 
 * @param {*} socket 
 * @param {*} event 
 * @param {*} msj 
 */
function NotificarATodos(io, socket, event, msj)
{
    socket.emit('ws:ok', 'Ok');
    let idRestaurant = socket.datos.idRestaurant;
    io.in(`monitoreo-pedidos-${idRestaurant}`).emit(event, msj);
    io.in(`monitoreo-camarero-${idRestaurant}`).emit(event, msj);
    io.in(`monitoreo-caja-${idRestaurant}`).emit(event, msj);
}