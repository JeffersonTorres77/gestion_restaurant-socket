module.exports = class UsuariosModel
{
    static async listado()
    {
        let query = "SELECT * FROM usuarios";
        let datos = await conexion.mysql.consultar(query);
        return datos;
    }
}