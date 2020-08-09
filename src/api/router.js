const showConsole = require('./../../config.json').showConsole;
const objRespuesta = require('./utils/respuesta');

const PlatosReigstro = require('./platos/registro');
const CombosReigstro = require('./combos/registro');
const ConsultarPedidos = require('./consultar/pedidos');
const ConsultarCantidadPedidos = require('./consultar/cantidad-pedidos');
const ELiminarPlatos = require('./platos/eliminar');
const ELiminarCombos = require('./combos/eliminar');
const ConfirmarPedidos = require('./pedidos/confirmar');
const ServicioCambio = require('./servicio/cambio');

module.exports = function(app)
{
    /**
     * Registro de platos
     */
    app.post('/Registro/Plato/', async (req, res) =>
    {
        try {
            await PlatosReigstro(req, res);
        } catch(e) {
            if(showConsole) console.log(e);
            res.send(objRespuesta.errorAPI(e));
        }
    });

    /**
     * Registro de combos
     */
    app.post('/Registro/Combo/', async (req, res) =>
    {
        try {
            await CombosReigstro(req, res);
        } catch(e) {
            if(showConsole) console.log(e);
            res.send(objRespuesta.errorAPI(e));
        }
    });
    
    /**
     * Consulta de pedidos
     */
    app.post('/Consultar/Pedidos/', async (req, res) =>
    {
        try {
            await ConsultarPedidos(req, res);
        } catch(e) {
            if(showConsole) console.log(e);
            res.send(objRespuesta.errorAPI(e));
        }
    });
    
    /**
     * Consulta de pedidos
     */
    app.post('/Consultar/Cantidad-Pedidos/', async (req, res) =>
    {
        try {
            await ConsultarCantidadPedidos(req, res);
        } catch(e) {
            if(showConsole) console.log(e);
            res.send(objRespuesta.errorAPI(e));
        }
    });
    
    /**
     * Eliminar platos
     */
    app.post('/Eliminar/Plato/', async (req, res) =>
    {
        try {
            await ELiminarPlatos(req, res);
        } catch(e) {
            if(showConsole) console.log(e);
            res.send(objRespuesta.errorAPI(e));
        }
    });

    /**
     * Eliminar combos
     */
    app.post('/Eliminar/Combo/', async (req, res) =>
    {
        try {
            await ELiminarCombos(req, res);
        } catch(e) {
            if(showConsole) console.log(e);
            res.send(objRespuesta.errorAPI(e));
        }
    });

    /**
     * Confirmar pedidos
     */
    app.post('/Confirmar/Pedidos/', async (req, res) =>
    {
        try {
            await ConfirmarPedidos(req, res);
        } catch(e) {
            if(showConsole) console.log(e);
            res.send(objRespuesta.errorAPI(e));
        }
    });

    /**
     * 
     */
    app.post('/Servicio/Cambio/', async(req, res) =>
    {
        try {
            await ServicioCambio(req, res);
        } catch(e) {
            if(showConsole) console.log(e);
            res.send(objRespuesta.errorAPI(e));
        }
    });
}