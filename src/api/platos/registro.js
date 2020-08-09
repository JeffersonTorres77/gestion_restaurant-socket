const aes = require('./../../sistema/utils/aes');
const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');
const path = require('path');
const objRespuesta = require('./../utils/respuesta');

const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const MesaModel = require('./../../sistema/modelos/mesas/especifico');
const PlatoModel = require('./../../sistema/modelos/platos/especifico');
const CategoriaModel = require('./../../sistema/modelos/categorias/especifico');
const PedidosModel = require('./../../sistema/modelos/pedidos/general');

const MonitoreoCocina = require('./../../sockets/emits/monitoreo-cocina');

module.exports = async (req, res) =>
{
    // Preparamos la respuesta
    let respuesta = objRespuesta.respAPI();

    // Parametros
    let key = req.body.key;
    let idPlato = req.body.idPlato;
    let cantidad = req.body.cantidad;
    let observaciones = req.body.observaciones;

    // Validamos
    if(key == undefined) throw "No se ha enviado 'key'.";
    if(idPlato == undefined) throw "No se ha enviado 'idPlato'.";
    if(cantidad == undefined) throw "No se ha enviado 'cantidad'.";
    if(observaciones == undefined) throw "No se ha enviado 'observaciones'.";

    // Iniciamos la conexion
    key = JSON.parse( aes.desencriptar(key) );
    let conn = new mysql();
    conn.conectar();

    // Objetos basicos
    let objRestaurant = new RestaurantModel(conn);
    await objRestaurant.iniciar(key.idRestaurant);

    let objMesa = new MesaModel(conn);
    await objMesa.iniciar(key.idUsuario);

    let objPlato = new PlatoModel(conn);
    await objPlato.iniciar(idPlato);

    let objCategoria = new CategoriaModel(conn);
    await objCategoria.iniciar(objPlato.idCategoria);

    // Validamos
    if(objMesa.idRestaurant != objRestaurant.id) throw "La mesa seleccionada no pertenece al restaurant actual.";
    if(objRestaurant.activo == false) throw "El restaurant actual no esta activo.";
    if(objMesa.status == "CERRADA") throw "La mesa actual esta cerrada.";
    if(objRestaurant.servicio == false) throw "El servicio de mesas del restaurant actual no esta activo.";

    if(objPlato.idRestaurant != objRestaurant.id) throw "El plato seleccionado no pertenece al restaurant actual.";
    if(cantidad < 1) throw "La cantidad debe ser un entero positivo.";

    // Conexión con la base de datos temporal
    let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${objRestaurant.id}.db`);
    let connSqlite = new sqlite(pathDatabase);

    // Proceso
    let idRestaurant = objRestaurant.id;
    let idMesa = objMesa.id;
    idPlato = objPlato.id;
    let nombrePlato = objPlato.nombre;
    let idCombo = null;
    let nombreCombo = null;
    let loteCombo = 0;
    let idAreaMonitoreo = objCategoria.idAreaMonitoreo;
    let precioUnitario = objPlato.precioVenta;
    cantidad = cantidad;
    let descuento = 0;
    let nota = observaciones;
    let para_llevar = 0;
    let status = 0;

    await PedidosModel.registrar(
        connSqlite,
        idRestaurant,
        idMesa,
        idPlato,
        nombrePlato,
        idCombo,
        nombreCombo,
        loteCombo,
        idAreaMonitoreo,
        precioUnitario,
        cantidad,
        descuento,
        nota,
        para_llevar,
        status
    );

    // Desconectamos de todas las base de datos
    connSqlite.desconectar();
    conn.desconectar();

    // Mostramos la data
    res.json(respuesta);
}