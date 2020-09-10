module.exports = class MesasModel
{
    static async confirmar(conn, idMesa)
    {
        let query = `UPDATE pedidos SET status = '1' WHERE idMesa = '${idMesa}' AND status = '0'`;
        let resp = await conn.ejecutar(query);
    }

    static async listado(conn, condicional)
    {
        let where = (condicional != "") ? `WHERE ${condicional}` : '';
        let query = `SELECT * FROM mesas ${where}`;
        let datos = await conn.consultar(query);
        return datos;
    }
}