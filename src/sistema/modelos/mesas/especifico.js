module.exports = class MesaModel
{
    constructor(conn)
    {
        this.id = null;
        this.idRestaurant = null;
        this.status = null;
        this.alias = null;
        this.usuario = null;
        this.clave = null;
        this.fecha_registro = null;

        this.conn = conn;
        return this;
    }

    async iniciar(id)
    {
        if(isNaN(id)) throw "El idMesa debe ser numerico.";
        id = Number(id);

        let query = `SELECT * FROM mesas WHERE idMesa = '${id}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `La mesa [id: ${id}] no existe.`;
        }

        this.id = datos[0].idMesa;
        this.idRestaurant = datos[0].idRestaurant;
        this.status = datos[0].status;
        this.alias = datos[0].alias;
        this.usuario = datos[0].usuario;
        this.clave = datos[0].clave;
        this.fecha_registro = datos[0].fecha_registro;
    }
}