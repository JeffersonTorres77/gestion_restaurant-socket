module.exports = class PlatosModel
{
    constructor(conn)
    {
        this.id = null;
        this.idRestaurant = null;
        this.idCategoria = null;
        this.nombre = null;
        this.descripcion = null;
        this.imagen = null;
        this.activo = null;
        this.precioCosto = null;
        this.precioVenta = null;
        this.fecha_registro = null;

        this.conn = conn;
        return this;
    }

    async iniciar(id)
    {
        if(isNaN(id)) throw "El idPlato debe ser numerico.";
        id = Number(id);

        let query = `SELECT * FROM platos WHERE idPlato = '${id}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `El plato [id: ${id}] no existe.`;
        }

        this.id = datos[0].idPlato;
        this.idRestaurant = datos[0].idRestaurant;
        this.idCategoria = datos[0].idCategoria;
        this.nombre = datos[0].nombre;
        this.descripcion = datos[0].descripcion;
        this.imagen = datos[0].imagen;
        this.activo = (datos[0].activo == "1") ? true : false;
        this.precioCosto = datos[0].precioCosto;
        this.precioVenta = datos[0].precioVenta;
        this.fecha_registro = datos[0].fecha_registro;
    }
}