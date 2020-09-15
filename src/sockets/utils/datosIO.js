const aes = require("../../../src/sistema/utils/aes");
const mysql = require("./../../sistema/utils/mysql");
const UsuarioModel = require('./../../sistema/modelos/usuarios/especifico');
const RestaurantModel = require('./../../sistema/modelos/restaurantes/especifico');
const MesaModel = require('./../../sistema/modelos/mesas/especifico');

module.exports = async (socket) => {
    let resp = {};

    let accion = socket.handshake.query.accion;
    if(accion == undefined) throw "No se ha enviado la acción.";
    let key = socket.handshake.query.key;
    if(key == undefined) throw "No se ha enviado la key.";
    let jsonKey = JSON.parse( aes.desencriptar(key) );

    resp.accion = accion;

    let conn = new mysql();
    await conn.conectar();

    if(jsonKey.idUsuario) {
        let objUsuario = new UsuarioModel(conn);
        await objUsuario.iniciar(jsonKey.idUsuario);
        if(objUsuario.activo == false) throw "Usuario actual no activo.";
        resp.objUsuario = objUsuario;
    }

    if(jsonKey.idMesa) {
        let objMesa = new MesaModel(conn);
        await objMesa.iniciar(jsonKey.idMesa);
        resp.objMesa = objMesa;
    }

    let objRestaurant = new RestaurantModel(conn);
    await objRestaurant.iniciar(jsonKey.idRestaurant);
    if(objRestaurant.activo == false) throw "Restaurant actual no activo.";
    if(objRestaurant.servicio == false) throw "Servicio de mesa no activo.";
    resp.objRestaurant = objRestaurant;

    conn.desconectar();

    return resp;
}