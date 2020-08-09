const aes = require('./../../sistema/utils/aes');
const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');
const path = require('path');
const showConsole = require('./../../../config.json').showConsole;
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

    // Prepraramos la data
    let cantidad = await PedidosModel.cantidadSinConfirmar(connSqlite, objMesa.id);
    let pedidosArray = await PedidosModel.listado(connSqlite, `idMesa = '${objMesa.id}'`);

    let pedidosSalida = [];
    let arrayLoteCombos = {};
    for(let pedido of pedidosArray)
    {
        let esCombo = (pedido.loteCombo != ('0', 0));
        if(esCombo == false)
        {
            let objPlato = new PlatoModel(conn);
            await objPlato.iniciar(pedido.idPlato);
            pedido.imagenPlato = `${objRestaurant.id}/${objPlato.imagen}`;

            pedidosSalida.push({
                esCombo: esCombo,
                datos: pedido
            });
        }
        else
        {
            let objCombo = new ComboModel(conn);
            await objCombo.iniciar(pedido.idCombo);
            let imagenCombo = `${objRestaurant.id}/${objCombo.imagen}`;

            let objPlato = new PlatoModel(conn);
            await objPlato.iniciar(pedido.idPlato);
            pedido.imagenPlato = `${objRestaurant.id}/${objPlato.imagen}`;

            let indexPedido = `lote_${pedido.loteCombo}`;
            let index = null;

            if(arrayLoteCombos[indexPedido] == undefined)
            {
                index = pedidosSalida.length;
                arrayLoteCombos[indexPedido] = index;

                pedidosSalida.push({
                    esCombo: esCombo,
                    datos: {
                        id: objCombo.id,
                        lote: pedido.loteCombo,
                        nombre: objCombo.nombre,
                        imagen: imagenCombo,
                        descuento: objCombo.descuento,
                        status: 99,
                        pedidos: []
                    }
                });

                pedidosSalida[index].datos.pedidos.push(pedido);
            }
            else
            {
                index = arrayLoteCombos[indexPedido];
                pedidosSalida[index].datos.pedidos.push(pedido);
            }

            if(pedidosSalida[index].datos.status > pedido.status) {
                pedidosSalida[index].datos.status = pedido.status;
            }
        }
    }

    // Desconectamos de todas las base de datos
    connSqlite.desconectar();
    conn.desconectar();

    // Mostramos
    respuesta.cuerpo = {
        cantidad: cantidad,
        pedidos: pedidosSalida
    };
    res.send(respuesta);
}