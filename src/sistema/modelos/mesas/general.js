module.exports = class MesasModel
{
    static async confirmar(conn, idMesa)
    {
        let query = `UPDATE pedidos SET status = '1' WHERE idMesa = '${idMesa}' AND status = '0'`;
        let resp = await conn.ejecutar(query);
    }

    static async confirmarParaLlevar(conn, numero_factura)
    {
        let query = `UPDATE pedidos SET aux_1 = '${numero_factura}', status = '1' WHERE para_llevar = '1' AND status = '0'`;
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