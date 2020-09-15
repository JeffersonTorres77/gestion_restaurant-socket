const routerPedidos = require('./pedidos/router');
const routerServicio = require('./servicio/router');

module.exports = (app) => {
    routerPedidos(app);
    routerServicio(app);

    app.get('/', async(req, res) => {
        res.send("<label>Sistema funcionando</label>");
    });
}