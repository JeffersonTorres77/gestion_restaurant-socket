const FacturaModel = require('./especifico');

module.exports = class FacturasModel
{
    /**
     * 
     * @param {*} conn 
     * @param {*} idRestaurant 
     * @param {*} numero 
     * @param {*} total 
     * @param {*} idMoneda 
     */
    static async registrar(conn, idRestaurant, numero, total, idMoneda)
    {
        let now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let datosMax = await conn.consultar("SELECT MAX(idFactura) AS maxID FROM facturas");
        let maxID = (datosMax[0]['maxID'] != null) ? datosMax[0]['maxID'] : 0;
        let idFactura = maxID + 1;
        let fechaArray = now.split(' ');
        let fecha = fechaArray[0];
        let hora = fechaArray[1];

        let query = `INSERT INTO facturas (
            idFactura, idRestaurant, numero, idMoneda, total, fecha, hora
        ) VALUES (
            '${idFactura}', '${idRestaurant}', '${numero}', ${idMoneda}, '${total}', '${fecha}', '${hora}'
        )`;
        let resp = await conn.ejecutar(query);

        let objFactura = new FacturaModel(conn);
        await objFactura.iniciar(idFactura);
        return objFactura;
    }
}