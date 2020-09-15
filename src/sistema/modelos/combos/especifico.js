module.exports = class CombosModel
{
    constructor(conn)
    {
        this.id = null;
        this.idRestaurant = null;
        this.nombre = null;
        this.descripcion = null;
        this.imagen = null;
        this.descuento = null;
        this.activo = null;
        this.fecha_registro = null;

        this.conn = conn;
        return this;
    }

    async iniciar(id)
    {
        if(isNaN(id)) throw "El idCombo debe ser numerico.";
        id = Number(id);

        let query = `SELECT * FROM combos WHERE idCombo = '${id}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `El combo [id: ${id}] no existe.`;
        }

        this.id = datos[0].idCombo;
        this.idRestaurant = datos[0].idRestaurant;
        this.nombre = datos[0].nombre;
        this.descripcion = datos[0].descripcion;
        this.imagen = datos[0].imagen;
        this.descuento = datos[0].descuento;
        this.activo = (datos[0].activo == "1") ? true : false;
        this.fecha_registro = datos[0].fecha_registro;
    }

    async getCategorias(conn)
    {
        let query = `SELECT idCategoria, cantidad FROM combos_categorias WHERE idCombo = '${this.id}'`;
        let datos = conn.consultar(query);
        return datos;
    }
}