const path = require('path');

const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');

const PedidosModel = require('./../../sistema/modelos/pedidos/general');
const PedidoModel = require('./../../sistema/modelos/pedidos/especifico');
const MesaModel = require('./../../sistema/modelos/mesas/especifico');
const PlatoModel = require('./../../sistema/modelos/platos/especifico');
const CategoriaModel = require('./../../sistema/modelos/categorias/especifico');
const ComboModel = require('./../../sistema/modelos/combos/especifico');

module.exports =  (io, socket) => {
    socket.on('actualizar', async (data) => {
        let idAreaMonitoreo = data.idAreaMonitoreo;
        if(idAreaMonitoreo == null) throw "No se ha enviado el parametro 'idAreaMonitoreo'.";

        // Iniciamos la conexion
        let conn = new mysql();
        conn.conectar();

        // Conexión con la base de datos temporal
        let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${socket.datos.objRestaurant.id}.db`);
        let connSqlite = new sqlite(pathDatabase);

        let condicional = (idAreaMonitoreo == "1") ? `status = '1'` : `status = '1' AND idAreaMonitoreo = '${idAreaMonitoreo}'`;
        let arrayPedidos = await PedidosModel.listado(connSqlite, condicional);

        let resp = [];
        for(let filaPedido of arrayPedidos)
        {
            let objPlato = new PlatoModel(conn);
            await objPlato.iniciar(filaPedido.idPlato);

            let objCategoria = new CategoriaModel(conn);
            await objCategoria.iniciar(objPlato.idCategoria);

            let objMesa = {
                id: -1,
                alias: "Para llevar"
            };
            if(filaPedido.idMesa != -1) {
                objMesa = new MesaModel(conn);
                await objMesa.iniciar(filaPedido.idMesa);
            }

            let combo = null;
            if(filaPedido.loteCombo.toString() != '0') {
                let objCombo = new ComboModel(conn);
                await objCombo.iniciar(filaPedido.idCombo);
                combo = {
                    id: objCombo.id,
                    nombre: objCombo.nombre
                };
            }

            let mesa = {
                id: objMesa.id,
                nombre: objMesa.alias
            };

            let plato = {
                id: objPlato.id,
                nombre: objPlato.nombre,
                imagen: objPlato.imagen
            };

            let categoria = {
                id: objCategoria.id,
                nombre: objCategoria.nombre,
                lote: filaPedido.loteCombo
            };

            resp.push({
                id: filaPedido.idPedido,
                cantidad: filaPedido.cantidad,
                nota: filaPedido.nota,
                mesa: mesa,
                plato: plato,
                categoria: categoria,
                combo: combo,
                idAreaMonitore: filaPedido.idAreaMonitoreo,
                para_llevar: filaPedido.para_llevar,
                fecha_registro: filaPedido.fecha_registro,
                fecha_modificacion: filaPedido.fecha_modificacion
            });
        }

        // Enviamos
        socket.emit('actualizar', resp);

        // Desconectamos de todas las base de datos
        connSqlite.desconectar();
        conn.desconectar();
    });

    socket.on('entrega', async (data) => {
        let idPedido = data.idPedido;
        if(idPedido == null) throw "No se ha enviado el parametro 'idPedido'.";

        // Iniciamos la conexion
        let conn = new mysql();
        conn.conectar();

        // Conexión con la base de datos temporal
        let pathDatabase = path.join(__dirname, "..", "..", "..", "database", `restaurant-${socket.datos.objRestaurant.id}.db`);
        let connSqlite = new sqlite(pathDatabase);

        let objPedido = new PedidoModel(connSqlite);
        await objPedido.iniciar(idPedido);
        await objPedido.setStatus(2);

        // Desconectamos de todas las base de datos
        connSqlite.desconectar();
        conn.desconectar();

        io.in("MonitoreoPedidos" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCamarero" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCaja" + socket.datos.objRestaurant.id).emit('cambio');
    });
}