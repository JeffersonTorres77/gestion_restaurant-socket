module.exports = class MesaModel
{
    constructor(conn)
    {
        this.id = null;
        this.idRestaurant = null;
        this.idMesa = null;
        this.idPlato = null;
        this.nombrePlato = null;
        this.idCombo = null;
        this.nombreCombo = null;
        this.loteCombo = null;
        this.idAreaMonitoreo = null;
        this.precioUnitario = null;
        this.cantidad = null;
        this.descuento = null;
        this.precioTotal = null;
        this.nota = null;
        this.status = null;
        this.para_llevar = null;
        this.fecha_registro = null;
        this.fecha_modificacion = null;

        this.conn = conn;
        return this;
    }

    async iniciar(id)
    {
        if(isNaN(id)) throw "El idPedido debe ser numerico.";
        id = Number(id);

        let query = `SELECT * FROM pedidos WHERE idPedido = '${id}'`;
        let datos = await this.conn.consultar(query);
        if(datos.length == 0) {
            throw `El pedido [id: ${id}] no existe.`;
        }

        this.id = datos[0].idPedido;
        this.idRestaurant = datos[0].idRestaurant;
        this.idMesa = datos[0].idMesa;
        this.idPlato = datos[0].idPlato;
        this.nombrePlato = datos[0].nombrePlato;
        this.idCombo = datos[0].idCombo;
        this.nombreCombo = datos[0].nombreCombo;
        this.loteCombo = datos[0].loteCombo;
        this.idAreaMonitoreo = datos[0].idAreaMonitoreo;
        this.precioUnitario = datos[0].precioUnitario;
        this.cantidad = datos[0].cantidad;
        this.descuento = datos[0].descuento;
        this.precioTotal = datos[0].precioTotal;
        this.nota = datos[0].nota;
        this.status = datos[0].status;
        this.para_llevar = datos[0].para_llevar;
        this.fecha_registro = datos[0].fecha_registro;
        this.fecha_modificacion = datos[0].fecha_modificacion;
    }
    
    async eliminar()
    {
        let query = `DELETE FROM pedidos WHERE idPedido = '${this.id}'`;
        let resp = await this.conn.ejecutar(query);
    }

    async eliminarPorLote()
    {
        if(this.loteCombo == ('0', 0)) {
            throw "El pedido seleccionado no tiene lote de combo.";
        }

        let query = `DELETE FROM pedidos WHERE loteCombo = '${this.loteCombo}'`;
        let resp = await this.conn.ejecutar(query);
    }

    async setStatus(idStatus)
    {
        let query = `UPDATE pedidos SET status = '${idStatus}' WHERE idPedido = '${this.id}'`;
        let resp = await this.conn.ejecutar(query);
    }
}