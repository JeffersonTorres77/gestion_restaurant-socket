const respuesta = require('./../response');
const validaciones = require('./../validaciones');
const controlador = require('./controlador');

module.exports = (app) => {
    /**
     * 
     */
    app.post('/pedidos/registro/plato', async(req, res) => {
        try {

            req = await validaciones.request(req);
            await controlador.registroPlato(req, res);
            
        } catch(e) {
            res.json(respuesta.error(e));
        }
    });

    /**
     * 
     */
    app.post('/pedidos/registro/combo', async(req, res) => {
        try {

            req = await validaciones.request(req);
            await controlador.registroCombo(req, res);

        } catch(e) {
            res.json(respuesta.error(e));
        }
    });

    /**
     * 
     */
    app.post('/pedidos/eliminar', async(req, res) => {
        try {

            req = await validaciones.request(req);
            await controlador.eliminar(req, res);

        } catch(e) {
            res.json(respuesta.error(e));
        }
    });

    /**
     * 
     */
    app.post('/pedidos/consulta', async(req, res) => {
        try {

            req = await validaciones.request(req);
            await controlador.consulta(req, res);

        } catch(e) {
            res.json(respuesta.error(e));
        }
    });

    /**
     * 
     */
    app.post('/pedidos/confirmar', async(req, res) => {
        try {

            req = await validaciones.request(req);
            await controlador.confirmar(req, res);

        } catch(e) {
            res.json(respuesta.error(e));
        }
    });

    /**
     * 
     */
    app.post('/pedidos/camarero', async(req, res) => {
        try {
            
            req = await validaciones.request(req);
            await controlador.camarero(req, res);

        } catch(e) {
            res.json(respuesta.error(e));
        }
    })
}