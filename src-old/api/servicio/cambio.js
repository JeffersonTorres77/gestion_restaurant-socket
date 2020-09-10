const aes = require('./../../sistema/utils/aes');
const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');
const path = require('path');
const showConsole = require('./../../../config.json').showConsole;
const urlWS = require('./../../../config.json').urlWS;
const io = require('socket.io-client');
const objRespuesta = require('./../utils/respuesta');

const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const UsuarioModel = require('./../../sistema/modelos/usuarios/especifico');
const RolModel = require('./../../sistema/modelos/roles/especifico');

module.exports = async (req, res) =>
{
    // Preparamos la respuesta
    let respuesta = objRespuesta.respAPI();
    
    // Parametros
    let key = req.body.key;

    // Validamos
    if(key == undefined) throw "No se ha enviado 'key'.";

    // Iniciamos la conexion
    key = JSON.parse( aes.desencriptar(key) );
    let conn = new mysql();
    conn.conectar();

    // Objetos basicos
    let objRestaurant = new RestaurantModel(conn);
    await objRestaurant.iniciar(key.idRestaurant);

    let objUsuario = new UsuarioModel(conn);
    await objUsuario.iniciar(key.idUsuario);

    let objRol = new RolModel(conn);
    await objRol.iniciar(objUsuario.idRol);

    // Validamos
    if(objUsuario.idRestaurant != objRestaurant.id) throw "El usuario no pertenece al restaurant actual.";
    if(objRestaurant.activo == false) throw "El restaurant actual no esta activo.";
    if(objUsuario.activo == false) throw "El usuario actua no esta activo.";
    if(objRol.responsable == false) throw "El usuario actual no tiene permisos de cambiar el status del servicio.";

    // Desconectamos de todas las base de datos
    conn.desconectar();
    
    // Enviamos a sockets
    let socket = io(urlWS, {
        query: {
            area: "SERVER",
            idRestaurant: key.idRestaurant,
            idUsuario: key.idUsuario,
            ip: key.ip
        }
    });

    let evento = (objRestaurant.servicio) ? 'desactivar-servicio' : 'activar-servicio';

    socket.on('connect', () => {
        socket.emit(evento, []);

        socket.on('ws:ok', (data) => {
            // Mostramos
            res.json(respuesta);
        });
        
        socket.on('ws:error', (data) => {
            respuesta = objRespuesta.errorAPI(data);
            res.json(respuesta);
        });
    });
}