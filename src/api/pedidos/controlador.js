const path = require('path');
const io = require('socket.io-client');
const respuesta = require('./../response');
const mysql = require('../../sistema/utils/mysql');
const sqlite = require('../../sistema/utils/sqlite3');
const config = require('./../../sistema/config');

const PedidosModel = require('./../../sistema/modelos/pedidos/general');
const PedidoModel = require('./../../sistema/modelos/pedidos/especifico');
const PlatoModel = require('./../../sistema/modelos/platos/especifico');
const CategoriaModel = require('./../../sistema/modelos/categorias/especifico');
const ComboModel = require('./../../sistema/modelos/combos/especifico');
const MesasModel = require('./../../sistema/modelos/mesas/general');
const FacturasModel = require('./../../sistema/modelos/facturas/general');

module.exports = {
    /**
     * 
     */
    registroPlato: async (req, res) => {
        // Tomamos los parametros
        let idPlato = req.body.idPlato;
        let cantidad = req.body.cantidad;
        let observaciones = req.body.observaciones;
        let para_llevar = (req.body.para_llevar == undefined) ? 0 : req.body.para_llevar;
        para_llevar = (para_llevar || para_llevar == "true" || para_llevar == '1') ? 1 : 0;

        // Conectamos a MySQL
        let conn = new mysql();
        conn.conectar();

        // Conectamos a SQLite3
        let rutaDbSqlite = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${req.objRestaurant.id}.db`);
        let connSqlite = new sqlite(rutaDbSqlite);
        connSqlite.conectar();

        let idMesa = -1;
        if(req.objMesa != undefined) {
            idMesa = req.objMesa.id;
        }

        // Buscamos el plato
        let objPlato = new PlatoModel(conn);
        await objPlato.iniciar(idPlato);
        // Buscamos la categoria
        let objCategoria = new CategoriaModel(conn);
        await objCategoria.iniciar(objPlato.idCategoria);
        // Validamos el plato
        if(objPlato.idRestaurant != req.objRestaurant.id) {
            connSqlite.desconectar();
            conn.desconectar();
            throw "El plato seleccionado no pertenece al restaurant actual.";
        }

        // Registramos
        let objPedido = await PedidosModel.registrar(
            connSqlite, // Conexion
            req.objRestaurant.id, // id restaurant
            idMesa, // id mesa
            objPlato.id, // id plato
            objPlato.nombre, // nombre plato
            null, // id combo
            null, // nombre combo
            0, // lote combo
            objCategoria.idAreaMonitoreo, // id area monitoreo
            objPlato.precioVenta, // precio unitario
            cantidad, // cantidad
            0, // descuento
            observaciones, // nota
            para_llevar, // para llevar
            0 // status
        );

        // Desconectamos
        connSqlite.desconectar();
        conn.desconectar();

        // Respondemos
        delete objPedido.conn;
        res.json(respuesta.resp(objPedido));
    },

    /**
     * 
     */
    registroCombo: async (req, res) => {
        // Parametros
        let idCombo = req.body.idCombo;
        let platos = req.body.platos;
        let para_llevar = (req.body.para_llevar == undefined) ? 0 : req.body.para_llevar;
        para_llevar = (para_llevar || para_llevar == "true" || para_llevar == '1') ? 1 : 0;

        // Conectamos a MySQL
        let conn = new mysql();
        conn.conectar();

        let objCombo = new ComboModel(conn);
        await objCombo.iniciar(idCombo);
        if(objCombo.activo == false) {
            connSqlite.desconectar();
            conn.desconectar();
            throw "El combo seleccionado no esta activo.";
        }

        let limiteCategorias = await objCombo.getCategorias(conn);
        for(let i=0; i<limiteCategorias.length; i++) {
            let cantActual = 0;

            for(let plato of platos) {
                if(limiteCategorias[i].idCategoria == plato.idCategoria) {
                    cantActual += Number(plato.cantidad);
                }
            }

            if(cantActual != limiteCategorias[i].cantidad) {
                conn.desconectar();
                throw `La cantidad de platos (${cantActual}) en la categoria ${limiteCategorias[i].idCategoria} es distinto el limite (${limiteCategorias[i].cantidad}).`;
            }
        }

        let idMesa = -1;
        if(req.objMesa != undefined) {
            idMesa = req.objMesa.id;
        }

        // Conectamos a SQLite3
        let rutaDbSqlite = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${req.objRestaurant.id}.db`);
        let connSqlite = new sqlite(rutaDbSqlite);
        connSqlite.conectar();

        let datosLote = await connSqlite.consultar("SELECT MAX(loteCombo) AS maxID FROM pedidos");
        let maxLote = (datosLote[0]['maxID'] != null) ? datosLote[0]['maxID'] : 0;
        maxLote += 1;

        let arrayPedidos = [];
        for(let plato of platos) {
            // idPlato - idCategoria, cantidad, nota

            // Buscamos el plato
            let objPlato = new PlatoModel(conn);
            await objPlato.iniciar(plato.id);
            // Buscamos la categoria
            let objCategoria = new CategoriaModel(conn);
            await objCategoria.iniciar(objPlato.idCategoria);
            // Validamos el plato
            if(objPlato.idRestaurant != req.objRestaurant.id) {
                connSqlite.desconectar();
                conn.desconectar();
                throw "El plato seleccionado no pertenece al restaurant actual.";
            }

            // Registramos
            let objPedido = await PedidosModel.registrar(
                connSqlite, // Conexion
                req.objRestaurant.id, // id restaurant
                idMesa, // id mesa
                objPlato.id, // id plato
                objPlato.nombre, // nombre plato
                objCombo.id, // id combo
                objCombo.nombre, // nombre combo
                maxLote, // lote combo
                objCategoria.idAreaMonitoreo, // id area monitoreo
                objPlato.precioVenta, // precio unitario
                plato.cantidad, // cantidad
                objCombo.descuento, // descuento
                plato.nota, // nota
                para_llevar, // para llevar
                0 // status
            );

            delete objPedido.conn;
            arrayPedidos.push(objPedido);
        }

        // Desconectamos
        connSqlite.desconectar();
        conn.desconectar();

        // Respondemos
        res.json( respuesta.resp(arrayPedidos) );
    },

    /**
     * 
     */
    eliminar: async (req, res) => {
        // Tomamos los parametros
        let idPedido = req.body.idPedido;

        // Conectamos a MySQL
        let conn = new mysql();
        conn.conectar();

        // Conectamos a SQLite3
        let rutaDbSqlite = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${req.objRestaurant.id}.db`);
        let connSqlite = new sqlite(rutaDbSqlite);
        connSqlite.conectar();

        // Buscamos el plato
        let objPedido = new PedidoModel(connSqlite);
        await objPedido.iniciar(idPedido);

        // Realizamos la operación
        if(objPedido.loteCombo == 0) {
            await objPedido.eliminar();
        } else {
            await objPedido.eliminarPorLote();
        }

        // Desconectamos
        connSqlite.desconectar();
        conn.desconectar();
        
        // Respondemos
        res.json(respuesta.resp('Ok'));
    },

    /**
     * 
     */
    consulta: async (req, res) => {
        let para_llevar = (req.body.para_llevar == "true" || req.body.para_llevar == "1") ? true : false;

        // Conectamos a MySQL
        let conn = new mysql();
        conn.conectar();

        // Conectamos a SQLite3
        let rutaDbSqlite = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${req.objRestaurant.id}.db`);
        let connSqlite = new sqlite(rutaDbSqlite);
        connSqlite.conectar();

        let condicional = `idRestaurant = '${req.objRestaurant.id}'`;

        if(req.body.status != undefined) {
            condicional += ` AND status = '${req.body.status}'`;
        }

        if(req.body.no_status != undefined) {
            condicional += ` AND status <> '${req.body.no_status}'`;
        }

        if(req.objMesa != undefined) {
            condicional += ` AND idMesa = '${req.objMesa.id}'`;
        }

        if(para_llevar == true) {
            condicional += ` AND para_llevar = '1'`;
        }

        let arrayPedidos =  await PedidosModel.listado(connSqlite, condicional);
        let salida = {
            cantidad: arrayPedidos.length,
            pedidos: []
        };

        let iva = req.objRestaurant.iva;

        for(let filaPedido of arrayPedidos) {

            delete filaPedido.aux_2;
            delete filaPedido.aux_3;

            let precioUnitario = Number(filaPedido.precioUnitario) * (1 + (Number(iva) / 100));
            let precioTotal = Number(filaPedido.precioTotal) * (1 + (Number(iva) / 100));

            if(filaPedido.loteCombo == 0) {

                let objPlato = new PlatoModel(conn);
                await objPlato.iniciar(filaPedido.idPlato);

                let objCategoria = new CategoriaModel(conn);
                await objCategoria.iniciar(objPlato.idCategoria);
                
                delete objPlato.conn;
                delete objCategoria.conn;

                delete objPlato.precioCosto;
                delete objPlato.precioVenta;

                salida.pedidos.push({
                    esCombo: false,
                    loteOrden: filaPedido.loteOrden,
                    platos: [{
                        idPedido: filaPedido.idPedido,
                        loteOrden: filaPedido.loteOrden,
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
                        fecha_registro: filaPedido.fecha_registro,
                        numero_factura: filaPedido.aux_1
                    }]
                });
                
            } else {

                let objCombo = new ComboModel(conn);
                await objCombo.iniciar(filaPedido.idCombo);

                let objPlato = new PlatoModel(conn);
                await objPlato.iniciar(filaPedido.idPlato);

                let objCategoria = new CategoriaModel(conn);
                await objCategoria.iniciar(objPlato.idCategoria);

                delete objCombo.conn;
                delete objPlato.conn;
                delete objCategoria.conn;
                
                delete objPlato.precioCosto;
                delete objPlato.precioVenta;

                let index = null;
                for(let indexPedido in salida.pedidos) {
                    if(salida.pedidos[indexPedido].lote == filaPedido.loteCombo) {
                        index = indexPedido;
                    }
                }

                if(index != null) {

                    salida.pedidos[index].platos.push({
                        idPedido: filaPedido.idPedido,
                        loteOrden: filaPedido.loteOrden,
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
                        fecha_registro: filaPedido.fecha_registro,
                        numero_factura: filaPedido.aux_1
                    });

                } else {

                    salida.pedidos.push({
                        esCombo: true,
                        lote: filaPedido.loteCombo,
                        combo: objCombo,
                        loteOrden: filaPedido.loteOrden,
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
                            fecha_registro: filaPedido.fecha_registro,
                            numero_factura: filaPedido.aux_1
                        }]
                    });

                }

            }
        }

        // Desconectamos
        connSqlite.desconectar();
        conn.desconectar();
        
        // Respondemos
        res.json( respuesta.resp(salida) );
    },

    confirmar: async(req, res) => {
        // Conectamos a MySQL
        let conn = new mysql();
        conn.conectar();

        // Conectamos a SQLite3
        let rutaDbSqlite = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${req.objRestaurant.id}.db`);
        let connSqlite = new sqlite(rutaDbSqlite);
        connSqlite.conectar();

        // Realizamos la operación
        if(req.objMesa != undefined)
        {
            let idMesa = (req.objMesa != undefined) ? req.objMesa.id : req.body.idMesa;
            await MesasModel.confirmar(connSqlite, idMesa);
        }
        else
        {
            await MesasModel.confirmarParaLlevar(connSqlite);
        }

        // Desconectamos
        connSqlite.desconectar();
        conn.desconectar();

        NotificarCambio(req.body.key);

        // Respondemos
        res.json( respuesta.resp('Ok') );
    },

    camarero: async(req, res) => {
        let accion = req.body.accion.toLowerCase();
        let cuenta = (req.body.cuenta == undefined) ? false : true;
        let resp = {};

        // Conectamos a MySQL
        let conn = new mysql();
        conn.conectar();
        req.objMesa.conn = conn;

        if(accion == "consultar") {

            resp.status = req.objMesa.solicitar_camarero;

        } else if(accion == "cambiar") {

            let status = '0';
            let statusActual = req.objMesa.solicitar_camarero;

            if(cuenta) {
                if(statusActual == '0') status = '2';
                if(statusActual == '1') status = '2';
            } else {
                if(statusActual == '0') status = '1';
                if(statusActual == '2') status = '1';
            }

            await req.objMesa.setLlamarCamarero(status);
            resp.status = status;
            NotificarCambio(req.body.key);

        }
        
        // Desconectamos
        conn.desconectar();

        // Respondemos
        res.json( respuesta.resp(resp) );
    },

    FacturarParaLlevar: async(req, res) => {
        let loteOrden = req.body.loteOrden;
        if(loteOrden == undefined) throw 'No se ha enviado el "loteOrden".';

        // Conectamos a MySQL
        let conn = new mysql();
        conn.conectar();

        // Conectamos a SQLite3
        let rutaDbSqlite = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${req.objRestaurant.id}.db`);
        let connSqlite = new sqlite(rutaDbSqlite);
        connSqlite.conectar();

        let pedidos = await PedidosModel.listado(connSqlite, `para_llevar = '1' AND loteOrden = '${loteOrden}'`);

        let idMesa = -1;
        let totalFactura = 0;

        for(let pedido of pedidos) {
            totalFactura = Number(totalFactura) + Number(pedido.precioTotal);
        }

        totalFactura = totalFactura.toFixed(2);
        let objFactura = await FacturasModel.registrar(
            conn,
            req.objRestaurant.id,
            totalFactura,
            req.objRestaurant.idMoneda,
            idMesa
            );

        for(let pedido of pedidos)
        {
            let objPedido = new PedidoModel(connSqlite);
            await objPedido.iniciar(pedido.idPedido);
            objPedido.status = 4;
            await objFactura.agregarDetalle(objPedido, objFactura.id);
            await objPedido.eliminar();
        }

        // Desconectamos
        connSqlite.desconectar();
        conn.desconectar();

        // Respondemos
        res.json( respuesta.resp(loteOrden) );
    }
}

/**
 * 
 * @param {*} key 
 */
function NotificarCambio(key) {
    // Enviamos a sockets
    let socket = io(config.urlWS, {
        query: {
            accion: "CambioCliente",
            key: key
        }
    });
    socket.on('connect', () => {
        socket.emit('cambio-general', []);
        socket.emit('cambio-general', []);
    });
}