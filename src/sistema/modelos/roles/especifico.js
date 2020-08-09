module.exports = class RestaurantModel
{
    constructor(conn)
    {
        this.id = null;
        this.idRestaurant = null;
        this.nombre = null;
        this.descripcion = null;
        this.responsable = null;
        this.fecha_registro = null;

        this.conn = conn;
        return this;
    }

    async iniciar(id)
    {
        if(isNaN(id)) throw "El ID debe ser numerico.";
        id = Number(id);

        let query = `SELECT * FROM roles WHERE idRol = '${id}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `El rol [id: ${id}] no existe.`;
        }
        
        this.id = datos[0].idRol;
        this.idRestaurant = datos[0].idRestaurant;
        this.nombre = datos[0].nombre;
        this.descripcion = datos[0].descripcion;
        this.responsable = ( datos[0].responsable.data[0] == '1' ) ? true : false;
        this.fecha_registro = datos[0].fecha_registro;
    }
}