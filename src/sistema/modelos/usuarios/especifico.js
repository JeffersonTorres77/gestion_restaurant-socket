module.exports = class UsuarioModel
{
    constructor(conn)
    {
        this.id = null;
        this.idRestaurant = null;
        this.usuario = null;
        this.nombre = null;
        this.documento = null;
        this.rol = null;
        this.activo = null;
        this.fecha_registro = null;

        this.conn = conn;
        return this;
    }
    
    async iniciar(idUsuario)
    {
        if(isNaN(idUsuario)) {
            throw "El idUSuario debe ser numerico.";
        }

        idUsuario = Number(idUsuario);

        let query = `SELECT * FROM usuarios WHERE idUsuario = '${idUsuario}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `El usuario [id: ${idUsuario}] no existe.`;
        }

        this.id = datos[0].idUsuario;
        this.idRestaurant = datos[0].idRestaurant;
        this.usuario = datos[0].usuario;
        this.nombre = datos[0].nombre;
        this.documento = datos[0].documento;
        this.idRol = datos[0].idRol;
        this.activo = datos[0].activo;
        this.fecha_registro = datos[0].fecha_registro;
    }
}