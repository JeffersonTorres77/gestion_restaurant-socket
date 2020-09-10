module.exports = class CategoriasModel
{
    constructor(conn)
    {
        this.id = null;
        this.idRestaurant = null;
        this.nombre = null;
        this.idAreaMonitoreo = null;
        this.fecha_registro = null;

        this.conn = conn;
        return this;
    }

    async iniciar(id)
    {
        if(isNaN(id)) throw "El idCategoria debe ser numerico.";
        id = Number(id);

        let query = `SELECT * FROM categorias WHERE idCategoria = '${id}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `La categoria [id: ${id}] no existe.`;
        }

        this.id = datos[0].idCategoria;
        this.idRestaurant = datos[0].idRestaurant;
        this.nombre = datos[0].nombre;
        this.idAreaMonitoreo = datos[0].idAreaMonitoreo;
        this.fecha_registro = datos[0].fecha_registro;
    }
}