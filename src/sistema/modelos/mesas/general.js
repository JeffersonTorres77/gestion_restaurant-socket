module.exports = class MesasModel
{
    static async confirmar(conn, idMesa)
    {
        let query = `UPDATE pedidos SET status = '1' WHERE idMesa = '${idMesa}' AND status = '0'`;
        let resp = await conn.ejecutar(query);
    }

    static async confirmarParaLlevar(conn)
    {
        let maxLoteOrden = await conn.consultar(`SELECT MAX(loteOrden) AS maxLote FROM pedidos`);
        let loteOrden = (maxLoteOrden != null) ? (maxLoteOrden[0]['maxLote'] + 1) : 1;
        let query = `UPDATE pedidos SET loteOrden = '${loteOrden}', status = '1' WHERE para_llevar = '1' AND status = '0'`;
        let resp = await conn.ejecutar(query);
        return loteOrden;
    }

    static async listado(conn, condicional)
    {
        let where = (condicional != "") ? `WHERE ${condicional}` : '';
        let query = `SELECT * FROM mesas ${where}`;
        let datos = await conn.consultar(query);
        return datos;
    }
}