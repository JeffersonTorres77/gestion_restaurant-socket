const path = require('path');

const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');

const PedidosModel = require('./../../sistema/modelos/pedidos/general');
const PedidoModel = require('./../../sistema/modelos/pedidos/especifico');
const MesasModel = require('./../../sistema/modelos/mesas/general');
const MesaModel = require('./../../sistema/modelos/mesas/especifico');
const PlatoModel = require('./../../sistema/modelos/platos/especifico');
const CategoriaModel = require('./../../sistema/modelos/categorias/especifico');
const ComboModel = require('./../../sistema/modelos/combos/especifico');
const FacturasModel = require('./../../sistema/modelos/facturas/general');

module.exports =  (io, socket) => {
    /**
     * 
     */
    socket.on('actualizar', async (data) => {
        // Iniciamos la conexion en la base de datos de MySQL
        let conn = new mysql();
        conn.conectar();

        // Iniciamos la conexion en la base de datos de SQLite
        let pathDB = path.join(__dirname, "..", "..", "..", "database", `restaurant-${socket.datos.objRestaurant.id}.db`);
        let connSqlite = new sqlite(pathDB);

        let respuesta = [];

        let iva = socket.datos.objRestaurant.iva;

        let condicional = "";
        let mesas = await MesasModel.listado(conn, condicional);
        for(let mesa of mesas)
        {
            let pedidosMesa = await PedidosModel.listado(connSqlite, `status <> '0' AND idMesa = '${mesa.idMesa}'`);
            let arrayPedidos = [];
            for(let filaPedido of pedidosMesa) {
                let precioUnitario = Number(filaPedido.precioUnitario) * (1 + Number(iva) / 100);
                let precioTotal = Number(filaPedido.precioTotal) * (1 + Number(iva) / 100);

                if(filaPedido.loteCombo == 0)
                {
                    let objPlato = new PlatoModel(conn);
                    await objPlato.iniciar(filaPedido.idPlato);
                    delete objPlato.conn;
                    delete objPlato.precioCosto;
                    delete objPlato.precioVenta;

                    let objCategoria = new CategoriaModel(conn);
                    await objCategoria.iniciar(objPlato.idCategoria);
                    delete objCategoria.conn;

                    arrayPedidos.push({
                        esCombo: false,
                        platos: [{
                            idPedido: filaPedido.idPedido,
                            idMesa: filaPedido.idMesa,
                            idAreaMonitoreo: filaPedido.idAreaMonitoreo,
                            plato: objPlato,
                            categoria: objCategoria,
                            nota: filaPedido.nota,
                            cantidad: filaPedido.cantidad,
                            descuento: filaPedido.descuento,
                            precioUnitario: precioUnitario.toFixed(2),
                            precioTotal: precioTotal.toFixed(2),
                            para_llevar: filaPedido.para_llevar,
                            status: filaPedido.status,
                            fecha_modificacion: filaPedido.fecha_modificacion,
                            fecha_registro: filaPedido.fecha_registro
                        }]
                    });
                }
                else
                {
                    let objCombo = new ComboModel(conn);
                    await objCombo.iniciar(filaPedido.idCombo);
                    delete objCombo.conn;

                    let objPlato = new PlatoModel(conn);
                    await objPlato.iniciar(filaPedido.idPlato);
                    delete objPlato.conn;
                    delete objPlato.precioCosto;
                    delete objPlato.precioVenta;

                    let objCategoria = new CategoriaModel(conn);
                    await objCategoria.iniciar(objPlato.idCategoria);
                    delete objCategoria.conn;

                    let index = null;
                    for(let indexPedido in arrayPedidos) {
                        if(arrayPedidos[indexPedido].lote == filaPedido.loteCombo) {
                            index = indexPedido;
                        }
                    }

                    if(index != null)
                    {
                        arrayPedidos[index].platos.push({
                            idPedido: filaPedido.idPedido,
                            idRestaurant: filaPedido.idRestaurant,
                            idMesa: filaPedido.idMesa,
                            idAreaMonitoreo: filaPedido.idAreaMonitoreo,
                            plato: objPlato,
                            categoria: objCategoria,
                            nota: filaPedido.nota,
                            cantidad: filaPedido.cantidad,
                            descuento: filaPedido.descuento,
                            precioUnitario: precioUnitario.toFixed(2),
                            precioTotal: precioTotal.toFixed(2),
                            para_llevar: filaPedido.para_llevar,
                            status: filaPedido.status,
                            fecha_modificacion: filaPedido.fecha_modificacion,
                            fecha_registro: filaPedido.fecha_registro
                        });
                    }
                    else
                    {
                        arrayPedidos.push({
                            esCombo: true,
                            lote: filaPedido.loteCombo,
                            combo: objCombo,
                            platos: [{
                                idPedido: filaPedido.idPedido,
                                idRestaurant: filaPedido.idRestaurant,
                                idMesa: filaPedido.idMesa,
                                idAreaMonitoreo: filaPedido.idAreaMonitoreo,
                                plato: objPlato,
                                categoria: objCategoria,
                                nota: filaPedido.nota,
                                cantidad: filaPedido.cantidad,
                                descuento: filaPedido.descuento,
                                precioUnitario: precioUnitario.toFixed(2),
                                precioTotal: precioTotal.toFixed(2),
                                para_llevar: filaPedido.para_llevar,
                                status: filaPedido.status,
                                fecha_modificacion: filaPedido.fecha_modificacion,
                                fecha_registro: filaPedido.fecha_registro
                            }]
                        });
                    }
                }
            }

            respuesta.push({
                idMesa: mesa.idMesa,
                alias: mesa.alias,
                solicitar_camarero: mesa.solicitar_camarero,
                status: mesa.status,
                pedidos: arrayPedidos
            });
        }

        // Enviamos
        socket.emit('actualizar', respuesta);

        // Desconectamos
        connSqlite.desconectar();
        conn.desconectar();
    });

    /**
     * 
     */
    socket.on('quitar-alarma', async(data) => {
        let idMesa = (data.idMesa != undefined) ? data.idMesa : 0;

        let conn = new mysql();
        conn.conectar();

        let objMesa = new MesaModel(conn);
        await objMesa.iniciar(idMesa);
        await objMesa.setLlamarCamarero(false);

        socket.emit('cambio');
        conn.desconectar();

        io.in("MonitoreoPedidos" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCamarero" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCaja" + socket.datos.objRestaurant.id).emit('cambio');
    });

    /**
     * 
     */
    socket.on('eliminar-pedido', async(data) => {
        // Parametros
        let idPedido = data.idPedido;
        if(idPedido == undefined) throw "No se ha enviado el parametro 'idPedido'.";
        let motivo = data.motivo;
        if(motivo == undefined) throw "No se ha enviado el parametro 'motivo'.";

        // Iniciamos la conexion
        let conn = new mysql();
        conn.conectar();

        // Conexión con la base de datos temporal
        let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${socket.datos.objRestaurant.id}.db`);
        let connSqlite = new sqlite(pathDatabase);

        let objPedido = new PedidoModel(connSqlite);
        await objPedido.iniciar(idPedido);

        // Proceso
        await PedidosModel.cancelar(conn, objPedido, motivo);
        await objPedido.eliminar();

        // Desconectamos de todas las base de datos
        connSqlite.desconectar();
        conn.desconectar();

        // Enviamos
        io.in("MonitoreoPedidos" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCamarero" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCaja" + socket.datos.objRestaurant.id).emit('cambio');
    });

    /**
     * 
     */
    socket.on('facturar', async(data) => {
        // Parametros
        let idMesa = data.idMesa;
        if(idMesa == undefined) throw "No se ha enviado el parametro 'idMesa'.";
        let idsPedidos = data.idsPedidos;
        if(idsPedidos == undefined) throw "No se ha enviado el parametro 'idsPedidos'.";

        if(idsPedidos.length <= 0) throw "Debe enviar almenos un pedido a facturar.";

        // Iniciamos la conexion
        let conn = new mysql();
        conn.conectar();

        // Objetos basicos
        let objMesa = new MesaModel(conn);
        await objMesa.iniciar(idMesa);

        let objRestaurant = socket.datos.objRestaurant;

        // Conexión con la base de datos temporal
        let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${objRestaurant.id}.db`);
        let connSqlite = new sqlite(pathDatabase);

        // Proceso
        let totalFactura = 0;
        let pedidosArray = [];
        for(let idPedido of idsPedidos)
        {
            let objPedido = new PedidoModel(connSqlite);
            await objPedido.iniciar(idPedido);
            pedidosArray.push(objPedido);
            totalFactura = Number(totalFactura) + Number(objPedido.precioTotal);
        }

        totalFactura = totalFactura.toFixed(2);
        let objFactura = await FacturasModel.registrar(conn, objRestaurant.id, totalFactura, objRestaurant.idMoneda, objMesa.id, objRestaurant.iva);

        for(let objPedido of pedidosArray)
        {
            objPedido.status = 4;
            await objFactura.agregarDetalle(objPedido, objFactura.id);
            await objPedido.eliminar();
        }

        // Desconectamos de todas las base de datos
        connSqlite.desconectar();
        conn.desconectar();

        // Enviamos
        io.in("MonitoreoPedidos" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCamarero" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCaja" + socket.datos.objRestaurant.id).emit('cambio');
    });
}