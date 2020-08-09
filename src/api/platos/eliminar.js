const io = require('socket.io-client');
const aes = require('./../../sistema/utils/aes');
const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');
const path = require('path');
const objRespuesta = require('./../utils/respuesta');

const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const MesaModel = require('./../../sistema/modelos/mesas/especifico');
const PlatoModel = require('./../../sistema/modelos/platos/especifico');
const CategoriaModel = require('./../../sistema/modelos/categorias/especifico');
const PedidoModel = require('./../../sistema/modelos/pedidos/especifico');
const PedidosModel = require('./../../sistema/modelos/pedidos/general');

module.exports = async (req, res) =>
{
    // Preparamos la respuesta
    let respuesta = objRespuesta.respAPI();

    // Parametros
    let key = req.body.key;
    let idPedido = req.body.idPedido;

    // Validamos
    if(key == undefined) throw "No se ha enviado 'key'.";
    if(idPedido == undefined) throw "No se ha enviado 'idPedido'.";

    // Iniciamos la conexion
    key = JSON.parse( aes.desencriptar(key) );
    let conn = new mysql();
    conn.conectar();

    // Objetos basicos
    let objRestaurant = new RestaurantModel(conn);
    await objRestaurant.iniciar(key.idRestaurant);

    let objMesa = new MesaModel(conn);
    await objMesa.iniciar(key.idUsuario);

    // Conexión con la base de datos temporal
    let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${objRestaurant.id}.db`);
    let connSqlite = new sqlite(pathDatabase);

    let objPedido = new PedidoModel(connSqlite);
    await objPedido.iniciar(idPedido);

    // Validamos
    if(objMesa.idRestaurant != objRestaurant.id) throw "La mesa seleccionada no pertenece al restaurant actual.";
    if(objRestaurant.activo == false) throw "El restaurant actual no esta activo.";
    if(objMesa.status == "CERRADA") throw "La mesa actual esta cerrada.";
    if(objRestaurant.servicio == false) throw "El servicio de mesas del restaurant actual no esta activo.";

    if(objPedido.idRestaurant != objRestaurant.id) throw "El pedido seleccionado no pertenece al restaurant actual.";
    if(objPedido.idMesa != objMesa.id) throw "El pedido seleccionado no pertenece a la mesa actual.";
    if(objPedido.status != 0) throw "No puede eliminar un pedido que ya ha sido confirmado.";

    // Realizamos la operación
    await objPedido.eliminar();

    // Desconectamos de todas las base de datos
    connSqlite.desconectar();
    conn.desconectar();

    // Mostramos la data
    res.json(respuesta);
}