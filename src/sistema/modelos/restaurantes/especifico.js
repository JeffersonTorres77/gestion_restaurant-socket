module.exports = class RestaurantModel
{
    constructor(conn)
    {
        this.id = null;
        this.documento = null;
        this.nombre = null;
        this.idMoneda = null;
        this.activo = null;
        this.servicio = null;
        this.fecha_registro = null;

        this.conn = conn;
        return this;
    }

    async iniciar(id)
    {
        if(isNaN(id)) throw "El idRestaurant debe ser numerico.";
        id = Number(id);

        let query = `SELECT * FROM restaurantes WHERE idRestaurant = '${id}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `El restaurant [id: ${id}] no existe.`;
        }

        this.id = datos[0].idRestaurant;
        this.documento = datos[0].documento;
        this.nombre = datos[0].nombre;
        this.idMoneda = datos[0].idMoneda;
        this.activo = (datos[0].activo == '1') ? true : false;
        this.servicio = (datos[0].servicio == '1') ? true : false;
        this.fecha_registro = datos[0].fecha_registro;
    }

    async setServicio(valor)
    {
        valor = (valor == true) ? 'true' : 'false';
        let query = `UPDATE restaurantes SET servicio = ${valor} WHERE idRestaurant = '${this.id}'`;
        let resp = await this.conn.ejecutar(query);
        return resp;
    }
}