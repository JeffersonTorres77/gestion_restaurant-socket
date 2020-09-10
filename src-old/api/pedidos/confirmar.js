const aes = require('./../../sistema/utils/aes');
const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');
const path = require('path');
const showConsole = require('./../../../config.json').showConsole;
const urlWS = require('./../../../config.json').urlWS;
const io = require('socket.io-client');
const objRespuesta = require('./../utils/respuesta');

const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const MesaModel = require('./../../sistema/modelos/mesas/especifico');
const MesasModel = require('./../../sistema/modelos/mesas/general');
const PedidosModel = require('./../../sistema/modelos/pedidos/general');

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

    let objMesa = new MesaModel(conn);
    await objMesa.iniciar(key.idUsuario);

    // Validamos
    if(objMesa.idRestaurant != objRestaurant.id) throw "La mesa seleccionada no pertenece al restaurant actual.";
    if(objRestaurant.activo == false) throw "El restaurant actual no esta activo.";
    if(objMesa.status == "CERRADA") throw "La mesa actual esta cerrada.";
    if(objRestaurant.servicio == false) throw "El servicio de mesas del restaurant actual no esta activo.";

    // Conexión con la base de datos temporal
    let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${objRestaurant.id}.db`);
    let connSqlite = new sqlite(pathDatabase);

    // Realizamos la operación
    await MesasModel.confirmar(connSqlite, objMesa.id);

    // Desconectamos de todas las base de datos
    connSqlite.desconectar();
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
    socket.on('connect', () => {
        socket.emit('actualizar-pedidos');
    });

    // Mostramos
    res.json(respuesta);
}