const fs = require('fs');
const path = require('path');
const showConsole = require('./../../../config.json').showConsole;
const sqlite = require('./../../sistema/utils/sqlite3');
const mysql = require('./../../sistema/utils/mysql');

const EmitMonitoreoCocina = require('./../emits/monitoreo-cocina');
const EmitMonitoreoCamarero = require('./../emits/monitoreo-camarero');
const EmitMonitoreoCaja = require('./../emits/monitoreo-caja');

const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const UsuarioModel = require('./../../sistema/modelos/usuarios/especifico.js');
const RolModel = require('./../../sistema/modelos/roles/especifico');

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
            io.in(`monitoreo-cocina-${idRestaurant}`).emit('cambio');
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
            if(fs.existsSync(pathDatabase)) {
                fs.writeFileSync(pathDatabase, "");
                fs.unlinkSync(pathDatabase);
            }

            await restaurant.setServicio(false);
            socket.emit('ws:ok', 'Ok');
            
            let idRestaurant = socket.datos.idRestaurant;
            io.in(`monitoreo-cocina-${idRestaurant}`).emit('ws:error', 'Servicio de mesas cerrado.');
            io.in(`monitoreo-camarero-${idRestaurant}`).emit('ws:error', 'Servicio de mesas cerrado.');
            io.in(`monitoreo-caja-${idRestaurant}`).emit('ws:error', 'Servicio de mesas cerrado.');
        }
        catch(err)
        {
            socket.emit('ws:error', err);
            if(showConsole) console.error(err);
        }
    });
}