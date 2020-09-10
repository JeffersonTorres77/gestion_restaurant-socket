const aes = require("./../../sistema/utils/aes");

module.exports = function(objQuery)
{
    let objSalida = {};

    if(objQuery.key == undefined) throw "No se ha especificado la key.";
    if(objQuery.area == undefined) throw "No se ha especificado el area.";
    if(objQuery.modulo == undefined) throw "No se ha especificado el modulo.";
    if(objQuery.archivo == undefined) throw "No se ha especificado el archivo.";

    let key = aes.desencriptar(objQuery.key.replace(/ /g, "+"));
    let objKey = JSON.parse(key);
    
    if(objKey.idRestaurant == undefined) throw "No se ha especificado el restaurant.";
    if(objKey.idUsuario == undefined) throw "No se ha especificado el usuario.";
    if(objKey.ip == undefined) throw "No se ha especificado la IP.";

    objSalida.area = objQuery.area;
    objSalida.modulo = objQuery.modulo;
    objSalida.archivo = objQuery.archivo;

    objSalida.idRestaurant = objKey.idRestaurant;
    objSalida.idUsuario = objKey.idUsuario;
    objSalida.ip = objKey.ip;

    return objSalida;
}