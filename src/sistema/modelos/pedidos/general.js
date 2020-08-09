module.exports = class PedidosModel
{
    static async listado(conn, condicional)
    {
        let where = (condicional != "") ? `WHERE ${condicional}` : '';
        let query = `SELECT * FROM pedidos ${where}`;
        let datos = await conn.consultar(query);
        return datos;
    }

    static async cantidadSinConfirmar(conn, idMesa)
    {
        let query = `SELECT COUNT(*) AS cantidad FROM pedidos WHERE idMesa = '${idMesa}' AND status = '0'`;
        let datos = await conn.consultar(query);
        let cantidad = datos[0]['cantidad'];
        return cantidad;
    }

    static async registrar(conn, idRestaurant, idMesa, idPlato, nombrePlato, idCombo, nombreCombo,
        loteCombo, idAreaMonitoreo, precioUnitario, cantidad, descuento, nota, para_llevar, status
        )
    {
        let now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let dataMaxId = await conn.consultar("SELECT MAX(idPedido) AS maxID FROM pedidos");
        let maxID = (dataMaxId != null) ? dataMaxId[0]['maxID'] : 0;

        let idPedido = maxID + 1;
        let precioTotal = (cantidad * precioUnitario) * (1 - (descuento / 100));
        let fecha_registro = now;
        let fecha_modificacion = fecha_registro;

        let query = `INSERT INTO pedidos (
            idPedido,
            idRestaurant,
            idMesa,
            idPlato,
            nombrePlato,
            idCombo,
            nombreCombo,
            loteCombo,
            idAreaMonitoreo,
            precioUnitario,
            cantidad,
            descuento,
            precioTotal,
            nota,
            status,
            para_llevar,
            fecha_registro,
            fecha_modificacion
        ) VALUES (
            '${idPedido}',
            '${idRestaurant}',
            '${idMesa}',
            '${idPlato}',
            '${nombrePlato}',
            '${idCombo}',
            '${nombreCombo}',
            '${loteCombo}',
            '${idAreaMonitoreo}',
            '${precioUnitario}',
            '${cantidad}',
            '${descuento}',
            '${precioTotal}',
            '${nota}',
            '${status}',
            '${para_llevar}',
            '${fecha_registro}',
            '${fecha_modificacion}'
        )`;
        let resp = await conn.ejecutar(query);
    }
}