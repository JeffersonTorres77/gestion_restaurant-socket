const PedidoModel = require('./especifico');

module.exports = class PedidosModel
{
    /**
     * 
     * @param {*} conn 
     * @param {*} condicional 
     */
    static async listado(conn, condicional)
    {
        let where = (condicional != "") ? `WHERE ${condicional}` : '';
        let query = `SELECT * FROM pedidos ${where}`;
        let datos = await conn.consultar(query);
        return datos;
    }

    /**
     * 
     * @param {*} conn 
     * @param {*} idMesa 
     */
    static async cantidadSinConfirmar(conn, idMesa)
    {
        let query = `SELECT COUNT(*) AS cantidad FROM pedidos WHERE idMesa = '${idMesa}' AND status = '0'`;
        let datos = await conn.consultar(query);
        let cantidad = datos[0]['cantidad'];
        return cantidad;
    }

    /**
     * 
     * @param {*} conn 
     * @param {*} idRestaurant 
     * @param {*} idMesa 
     * @param {*} idPlato 
     * @param {*} nombrePlato 
     * @param {*} idCombo 
     * @param {*} nombreCombo 
     * @param {*} loteCombo 
     * @param {*} idAreaMonitoreo 
     * @param {*} precioUnitario 
     * @param {*} cantidad 
     * @param {*} descuento 
     * @param {*} nota 
     * @param {*} para_llevar 
     * @param {*} status 
     */
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

        let objPedido = new PedidoModel(conn);
        await objPedido.iniciar(idPedido);
        return objPedido;
    }

    /**
     * 
     * @param {*} conn 
     * @param {*} objPedido 
     */
    static async cancelar(conn, objPedido, motivo)
    {
        let now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let datosMax = await conn.consultar("SELECT MAX(idFacturaDetalle) AS maxID FROM facturas_detalles");
        let maxID = (datosMax[0]['maxID'] != null) ? datosMax[0]['maxID'] : 0;
        let idFacturaDetalle = maxID + 1;
        let fecha_registro = now;

        let query = `INSERT INTO facturas_detalles (
            idFacturaDetalle,
            idFactura,
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
            motivo_cancelado,
            para_llevar,
            fecha_registro
        ) VALUES (
            '${idFacturaDetalle}',
            '-1',
            '${objPedido.idMesa}',
            '${objPedido.idPlato}',
            '${objPedido.nombrePlato}',
            '${objPedido.idCombo}',
            '${objPedido.nombreCombo}',
            '${objPedido.loteCombo}',
            '${objPedido.idAreaMonitoreo}',
            '${objPedido.precioUnitario}',
            '${objPedido.cantidad}',
            '${objPedido.descuento}',
            '${objPedido.precioTotal}',
            '${objPedido.nota}',
            '5',
            '${motivo}',
            '${objPedido.para_llevar}',
            '${fecha_registro}'
        )`;
        let resp = await conn.ejecutar(query);
    }
}