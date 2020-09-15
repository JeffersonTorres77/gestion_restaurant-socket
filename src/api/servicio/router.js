const respuesta = require('./../response');
const validaciones = require('./../validaciones');
const controlador = require('./controlador');

module.exports = (app) => {
    /**
     * 
     */
    app.post('/servicio/cambiar', async(req, res) => {
        try {

            req = await validaciones.request(req);
            await controlador.cambio(req, res);
            
        } catch(e) {
            res.json(respuesta.error(e));
        }
    });
}