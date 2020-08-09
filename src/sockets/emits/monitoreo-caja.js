const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');
const path = require('path');

const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const PlatoModel = require('./../../sistema/modelos/platos/especifico');
const CategoriaModel = require('./../../sistema/modelos/categorias/especifico');
const MesaModel = require('./../../sistema/modelos/mesas/especifico');
const MesasModel = require('./../../sistema/modelos/mesas/general');
const ComboModel = require('./../../sistema/modelos/combos/especifico');
const PedidoModel = require('./../../sistema/modelos/pedidos/especifico');
const PedidosModel = require('./../../sistema/modelos/pedidos/general');
const UsuarioModel = require('./../../sistema/modelos/usuarios/especifico');

module.exports = {
    actualizarTodo: async (io, socket, data) =>
    {
        // Iniciamos la conexion
        let conn = new mysql();
        conn.conectar();

        // Objetos basicos
        let objRestaurant = new RestaurantModel(conn);
        await objRestaurant.iniciar(socket.datos.idRestaurant);

        let objUsuario = new UsuarioModel(conn);
        await objUsuario.iniciar(socket.datos.idUsuario);

        // Validamos
        if(objUsuario.idRestaurant != objRestaurant.id) throw "El usuario no pertenece al restaurant actual.";
        if(objRestaurant.activo == false) throw "El restaurant actual no esta activo.";
        if(objUsuario.activo == false) throw "El usuario actual no esta activo.";
        if(objRestaurant.servicio == false) throw "El servicio de mesas del restaurant actual no esta activo.";

        // Conexión con la base de datos temporal
        let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${objRestaurant.id}.db`);
        let connSqlite = new sqlite(pathDatabase);

        // Buscamos
        let condicional = `idRestaurant = '${objRestaurant.id}'`;
        let datosMesas = await MesasModel.listado(conn, condicional);

        let mesas = [];
        for(let objMesa of datosMesas)
        {
            let pedidosArray = await PedidosModel.listado(connSqlite, `idMesa = '${objMesa.idMesa}' AND status <> '0' AND idRestaurant = '${objRestaurant.id}'`);
            let pedidos = [];
            let arrayLoteCombos = [];
            for(let pedido of pedidosArray)
            {
                let objPlato = new PlatoModel(conn);
                await objPlato.iniciar(pedido.idPlato);

                let objCategoria = new CategoriaModel(conn);
                await objCategoria.iniciar(objPlato.idCategoria);

                let combo = null;
                let esCombo = pedido.loteCombo != ('0', 0);
                if(esCombo) {
                    let objCombo = new ComboModel(conn);
                    await objCombo.iniciar(pedido.idCombo);
                    combo = {
                        id: objCombo.id,
                        nombre: objCombo.nombre,
                        imagen: `${objRestaurant.id}/${objCombo.imagen}`
                    };
                }

                let mesa = {
                    id: objMesa.id,
                    nombre: objMesa.alias
                };
    
                let plato = {
                    id: objPlato.id,
                    nombre: objPlato.nombre,
                    imagen: objRestaurant.id+"/"+objPlato.imagen
                };
                pedido.imagenPlato = plato.imagen;
    
                let categoria = {
                    id: objCategoria.id,
                    nombre: objCategoria.nombre,
                    lote: pedido.loteCombo
                };

                if(esCombo)
                {
                    let indexPedido = `lote_${pedido.loteCombo}`;
                    let index = null;

                    if(arrayLoteCombos[indexPedido] == undefined)
                    {
                        index = pedidos.length;
                        arrayLoteCombos[indexPedido] = index;

                        pedidos.push({
                            esCombo: esCombo,
                            datos: {
                                id: pedido.idPedido,
                                lote: pedido.loteCombo,
                                nombre: combo.nombre,
                                imagen: combo.imagen,
                                descuento: pedido.descuento,
                                mesa: mesa,
                                status: 99,
                                pedidos: []
                            }
                        });

                        pedidos[index].datos.pedidos.push(pedido);
                    }
                    else
                    {
                        index = arrayLoteCombos[indexPedido];
                        pedidos[index].datos.pedidos.push(pedido);
                    }

                    if(pedidos[index].datos.status > pedido.status) {
                        pedidos[index].datos.status = pedido.status;
                    }
                }
                else
                {
                    pedidos.push({
                        esCombo: esCombo,
                        datos: {
                            id: pedido.idPedido,
                            cantidad: pedido.cantidad,
                            nota: pedido.nota,
                            mesa: mesa,
                            plato: plato,
                            categoria: categoria,
                            combo: combo,
                            idAreaMonitore: pedido.idAreaMonitoreo,
                            precioUnitario: pedido.precioUnitario,
                            cantidad: pedido.cantidad,
                            descuento: pedido.descuento,
                            precioTotal: pedido.precioTotal,
                            status: pedido.status,
                            para_llevar: pedido.para_llevar,
                            fecha_registro: pedido.fecha_registro,
                            fecha_modificacion: pedido.fecha_modificacion
                        }
                    });
                }
            }

            mesas.push({
                id: objMesa.idMesa,
                alias: objMesa.alias,
                status: objMesa.status,
                usuario: objMesa.usuario,
                pedidos: pedidos
            });
        }

        // Desconectamos de todas las base de datos
        connSqlite.desconectar();
        conn.desconectar();

        // Enviamos
        socket.emit('actualizar-todo', mesas);
    },

    cambio: async (io, socket, data) =>
    {
        // Enviamos
        let idRestaurant = socket.datos.idRestaurant;
        io.in(`monitoreo-caja-${idRestaurant}`).emit('cambio');
    },

    facturar: async (io, socket, data) =>
    {
        socket.emit('ws:error', 'En desarrollo');
        // Enviar a caja y camarero
    }
}