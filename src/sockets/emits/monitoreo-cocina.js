const mysql = require('./../../sistema/utils/mysql');
const sqlite = require('./../../sistema/utils/sqlite3');
const path = require('path');

const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const PlatoModel = require('./../../sistema/modelos/platos/especifico');
const CategoriaModel = require('./../../sistema/modelos/categorias/especifico');
const MesaModel = require('./../../sistema/modelos/mesas/especifico');
const ComboModel = require('./../../sistema/modelos/combos/especifico');
const PedidoModel = require('./../../sistema/modelos/pedidos/especifico');
const PedidosModel = require('./../../sistema/modelos/pedidos/general');
const UsuarioModel = require('./../../sistema/modelos/usuarios/especifico');

const EmitMonitoreoCamarero = require('./monitoreo-camarero');

module.exports = {
    /**
     * 
     */
    actualizarTodo: async (io, socket, data) =>
    {
        let idAreaMonitoreo = data.idAreaMonitoreo;
        if(idAreaMonitoreo == null) throw "No se ha enviado el parametro 'idAreaMonitoreo'.";

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

        let condicional = (idAreaMonitoreo == "4") ? `status = '1'` : `status = '1' AND idAreaMonitoreo = '${idAreaMonitoreo}'`;
        let pedidos = await PedidosModel.listado(connSqlite, condicional);

        let datos = [];
        for(let pedido of pedidos)
        {
            let objPlato = new PlatoModel(conn);
            await objPlato.iniciar(pedido.idPlato);

            let objCategoria = new CategoriaModel(conn);
            await objCategoria.iniciar(objPlato.idCategoria);

            let objMesa = new MesaModel(conn);
            await objMesa.iniciar(pedido.idMesa);

            let combo = null;
            if(pedido.loteCombo != ('0', 0)) {
                let objCombo = new ComboModel(conn);
                await objCombo.iniciar(pedido.idCombo);
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
                imagen: objRestaurant.id+"/"+objPlato.imagen
            };

            let categoria = {
                id: objCategoria.id,
                nombre: objCategoria.nombre,
                lote: pedido.loteCombo
            };

            datos.push({
                id: pedido.idPedido,
                cantidad: pedido.cantidad,
                nota: pedido.nota,
                mesa: mesa,
                plato: plato,
                categoria: categoria,
                combo: combo,
                idAreaMonitore: pedido.idAreaMonitoreo,
                para_llevar: pedido.para_llevar,
                fecha_registro: pedido.fecha_registro,
                fecha_modificacion: pedido.fecha_modificacion
            });
        }

        // Desconectamos de todas las base de datos
        connSqlite.desconectar();
        conn.desconectar();

        // Enviamos
        socket.emit('actualizar-todo', datos);
    },

    /**
     * 
     */
    cambio: async (io, socket, data) =>
    {
        // Enviamos
        let idRestaurant = socket.datos.idRestaurant;
        io.in(`monitoreo-cocina-${idRestaurant}`).emit('cambio');
    },

    /**
     * 
     */
    entrega: async (io, socket, data) =>
    {
        // Parametros
        let idPedido = data.idPedido;
        if(idPedido == null) {
            socket.emit('ws:error', "No se envio el 'idPedido'.");
            return;
        }

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

        let objPedido = new PedidoModel(connSqlite);
        await objPedido.iniciar(idPedido);
        
        if(objPedido.idRestaurant != objRestaurant.id) throw "El pedido actual no pertenece a este restaurant.";

        await objPedido.setStatus(2);

        // Desconectamos de todas las base de datos
        connSqlite.desconectar();
        conn.desconectar();

        // Enviamos
        let idRestaurant = socket.datos.idRestaurant;
        io.in(`monitoreo-cocina-${idRestaurant}`).emit('cambio');
        io.in(`monitoreo-camarero-${idRestaurant}`).emit('cambio');
        io.in(`monitoreo-caja-${idRestaurant}`).emit('cambio');
    }
}