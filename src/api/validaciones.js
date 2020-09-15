const aes = require('./../sistema/utils/aes');
const mysql = require('./../sistema/utils/mysql');

const RestaurantModel = require('./../sistema/modelos/restaurantes/especifico');
const UsuarioModel = require('./../sistema/modelos/usuarios/especifico');
const MesaModel = require('./../sistema/modelos/mesas/especifico');

module.exports = {
    request: async (req) => {
        let key = req.body.key;
        if(key == undefined) throw "No se ha enviado la KEY";
        let authService = (req.body.authService == "false") ? false : true;

        key = JSON.parse( aes.desencriptar(key) );
        let conn = new mysql();
        conn.conectar();

        // Objetos basicos
        let objRestaurant = new RestaurantModel(conn);
        await objRestaurant.iniciar(key.idRestaurant);
        if(objRestaurant.activo == false) throw "El restaurant actual no esta activo.";

        if(authService == true) {
            if(objRestaurant.servicio == false) throw "El servicio de mesa del restaurant actual no esta activo.";
        }

        req.objRestaurant = objRestaurant;

        if(key.idUsuario != undefined)
        {
            let objUsuario = new UsuarioModel(conn);
            await objUsuario.iniciar(key.idUsuario);
            if(objUsuario.activo == false) throw "El usuario actual no esta activo.";
            req.objUsuario = objUsuario;
        }

        if(key.idMesa != undefined)
        {
            let objMesa = new MesaModel(conn);
            await objMesa.iniciar(key.idMesa);
            if(objMesa.status == "CERRADA") throw "La mesa actual esta cerrada.";
            req.objMesa = objMesa;
        }

        // Desconectamos de todas las base de datos
        conn.desconectar();
        
        return req;
    }
}