const path = require('path');
const fs = require('fs');
const respuesta = require('./../response');
const mysql = require('../../sistema/utils/mysql');
const sqlite = require('../../sistema/utils/sqlite3');

const RolModel = require('../../sistema/modelos/roles/especifico');

module.exports = {
    /**
     * 
     */
    cambio: async (req, res) => {
        if(req.objUsuario == undefined) throw "No se ha enviado la KEY.";
        let rutaDbSqlite = path.join(__dirname, '..', '..', '..', 'database', `restaurant-${req.objRestaurant.id}.db`);

        // Conectamos a MySQL
        let conn = new mysql();
        conn.conectar();

        req.objRestaurant.conn = conn;

        let objRol = new RolModel(conn);
        await objRol.iniciar(req.objUsuario.idRol);
        if(objRol.responsable == false) {
            conn.desconectar();
            throw "El usuario actual no tiene permisos para desactivar el servicio de mesas.";
        }

        if(req.objRestaurant.servicio == true)
        {
            if(await ValidarPosibleCierre(rutaDbSqlite) == false) {
                throw "Error al intentar cerrar el servicio de mesas, asegurese de <b>finalizar todos los pedidos</b> antes de cerrar.";
            }
            EliminarArchivoDB(rutaDbSqlite);
            await req.objRestaurant.setServicio(false);
        }
        else
        {
            let db = CrearArchivoDB(rutaDbSqlite);
            await EjecutarEstructura(db);
            db.desconectar();
            await req.objRestaurant.setServicio(true);
        }

        // Desconectamos
        conn.desconectar();

        // Respuesta
        res.json(respuesta.resp('Ok'));
    }
}

/**
 * 
 * @param {*} pathDB 
 */
function CrearArchivoDB(pathDB) {
    EliminarArchivoDB(pathDB);
    return new sqlite(pathDB);
}

/**
 * 
 * @param {*} db 
 */
async function EjecutarEstructura(db) {
    let pathEstructura = path.join(__dirname, '..', '..', '..', 'database', 'estructura.txt');
    let content = fs.readFileSync(pathEstructura).toString();
    let queryArray = content.split(";");
    for(let query of queryArray) {
        await db.ejecutar(query)
    }
}

/**
 * 
 * @param {*} pathDB 
 */
function EliminarArchivoDB(pathDB) {
    if(fs.existsSync(pathDB)) {
        try {
            fs.unlinkSync(pathDB);
        } catch(err) {
            fs.writeFileSync(pathDB, '');
        }
    }
}

/**
 * 
 * @param {*} pathDB 
 */
async function ValidarPosibleCierre(pathDB) {
    let resp = true;
    let db = new sqlite(pathDB);

    let query = "SELECT COUNT(*) AS cantidad FROM pedidos WHERE status <> '0'";
    let datos = await db.consultar(query);
    resp = (datos.cantidad > 0) ? false : true;

    db.desconectar();
    return resp;
}