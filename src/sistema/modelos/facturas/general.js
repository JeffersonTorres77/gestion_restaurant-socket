const FacturaModel = require('./especifico');

module.exports = class FacturasModel
{
    /**
     * 
     * @param {*} conn 
     * @param {*} idRestaurant 
     * @param {*} numero 
     * @param {*} total 
     */
    static async registrar(conn, idRestaurant, numero, total)
    {
        let now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let datosMax = await conn.consultar("SELECT MAX(idFactura) AS maxID FROM facturas");
        let maxID = (datosMax[0]['maxID'] != null) ? datosMax[0]['maxID'] : 0;
        let idFactura = maxID + 1;
        let fecha_registro = now;

        let query = `INSERT INTO facturas (
            idFactura, idRestaurant, numero, total, fecha_registro
        ) VALUES (
            '${idFactura}', '${idRestaurant}', '${numero}', '${total}', '${fecha_registro}'
        )`;
        let resp = await conn.ejecutar(query);

        let objFactura = new FacturaModel(conn);
        await objFactura.iniciar(idFactura);
        return objFactura;
    }
}