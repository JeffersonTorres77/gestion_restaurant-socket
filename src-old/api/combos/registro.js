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
const PedidosModel = require('./../../sistema/modelos/pedidos/general');
const ComboModel = require('./../../sistema/modelos/combos/especifico');

module.exports = async (req, res) =>
{
    // Preparamos la respuesta
    let respuesta = objRespuesta.respAPI();

    // Parametros
    let key = req.body.key;
    let idCombo = req.body.idCombo;
    let platos = req.body.platos;

    // Validamos
    if(key == undefined) throw "No se ha enviado 'key'.";
    if(idCombo == undefined) throw "No se ha enviado 'idCombo'.";
    if(platos == undefined) throw "No se ha enviado 'platos'.";

    // Iniciamos la conexion
    key = JSON.parse( aes.desencriptar(key) );
    let conn = new mysql();
    conn.conectar();

    // Objetos basicos
    let objRestaurant = new RestaurantModel(conn);
    await objRestaurant.iniciar(key.idRestaurant);

    let objMesa = new MesaModel(conn);
    await objMesa.iniciar(key.idUsuario);

    let objCombo = new ComboModel(conn);
    await objCombo.iniciar(idCombo);

    // Validamos
    if(objMesa.idRestaurant != objRestaurant.id) throw "La mesa seleccionada no pertenece al restaurant actual.";
    if(objRestaurant.activo == false) throw "El restaurant actual no esta activo.";
    if(objMesa.status == "CERRADA") throw "La mesa actual esta cerrada.";
    if(objRestaurant.servicio == false) throw "El servicio de mesas del restaurant actual no esta activo.";

    if(objCombo.idRestaurant != objRestaurant.id) throw "El plato seleccionado no pertenece al restaurant actual.";

    // Recorremos las categorias
    let categoriasCombo = await objCombo.getCategorias(conn);
    let arrayPedidos = [];
    for(let categoriaCombo of categoriasCombo)
    {
        let idCategoria = categoriaCombo['idCategoria'];
        let limite = categoriaCombo['cantidad'];
        let cantActual = 0;

        // Recorremos los platos
        for(let plato of platos)
        {
            let cantidad = plato.cantidad;
            let nota = plato.nota;
            
            let objPlato = new PlatoModel(conn);
            await objPlato.iniciar(plato.id);

            if(objPlato.idCategoria != idCategoria) continue;
            cantActual += 1;
            
            let objCategoria = new CategoriaModel(conn);
            await objCategoria.iniciar(objPlato.idCategoria);

            if(objPlato.idRestaurant != objRestaurant.id) throw "El plato seleccionado no pertenece al restaurant actual.";
            if(cantActual > limite) throw `Se ha superado el limite de platos de la categoria ${objCategoria.nombre}.`;

            arrayPedidos.push({
                plato: objPlato,
                categoria: objCategoria,
                cantidad: cantidad,
                nota: nota
            });
        }
    }

    // Conexión con la base de datos temporal
    let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${objRestaurant.id}.db`);
    let connSqlite = new sqlite(pathDatabase);
    
    // Registramos los platos del combo
    let datosLote = await connSqlite.consultar("SELECT MAX(loteCombo) AS maxID FROM pedidos");
    let maxLote = (datosLote[0]['maxID'] != null) ? datosLote[0]['maxID'] : 0;
    for(let fila of arrayPedidos)
    {
        let objPlato = fila.plato;
        let objCategoria = fila.categoria;

        // Proceso
        let idRestaurant = objRestaurant.id;
        let idMesa = objMesa.id;
        idPlato = objPlato.id;
        let nombrePlato = objPlato.nombre;
        let idCombo = objCombo.id;
        let nombreCombo = objCombo.nombre;
        let loteCombo = maxLote + 1;
        let idAreaMonitoreo = objCategoria.idAreaMonitoreo;
        let precioUnitario = objPlato.precioVenta;
        cantidad = fila.cantidad;;
        let descuento = objCombo.descuento;
        let nota = fila.nota;
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
    }

    // Desconectamos de todas las base de datos
    connSqlite.desconectar();
    conn.desconectar();

    // Mostramos la data
    res.json(respuesta);
}