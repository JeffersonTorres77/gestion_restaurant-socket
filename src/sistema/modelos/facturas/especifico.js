module.exports = class MesaModel
{
    /**
     * 
     * @param {*} conn 
     */
    constructor(conn)
    {
        this.id = null;
        this.idRestaurant = null;
        this.numero = null;
        this.total = null;

        this.conn = conn;
        return this;
    }

    /**
     * 
     * @param {*} id 
     */
    async iniciar(id)
    {
        if(isNaN(id)) throw "El idFactura debe ser numerico.";
        id = Number(id);

        let query = `SELECT * FROM facturas WHERE idFactura = '${id}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `La factura [id: ${id}] no existe.`;
        }

        this.id = datos[0].idFactura;
        this.idRestaurant = datos[0].idRestaurant;
        this.numero = datos[0].numero;
        this.total = datos[0].total;
    }

    /**
     * 
     */
    async agregarDetalle(objPedido, idFactura)
    {
        let now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let datosMax = await this.conn.consultar("SELECT MAX(idFacturaDetalle) AS maxID FROM facturas_detalles");
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
            para_llevar,
            fecha_registro
        ) VALUES (
            '${idFacturaDetalle}',
            '${idFactura}',
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
            '${objPedido.status}',
            '${objPedido.para_llevar}',
            '${fecha_registro}'
        )`;
        let resp = await this.conn.ejecutar(query);
    }
}