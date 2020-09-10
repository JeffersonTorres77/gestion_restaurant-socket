/**
 * Librerias importantes
 */
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./src/sistema/config');

/**
 * Configuramos el servidor
 */
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('port', config.Sockets.port);

/**
 * APIs
 */
try {

    //const router = require('./src/api/router')(app);

} catch(error) {
    config.Escribir(`API - ${error}`, "error");
}

/**
 * Inicio del servidor
 */
const server = app.listen(app.get('port'), () => {
    config.Escribir("Servidor funcionando en el puerto: " + app.get('port'));
});

/**
 * Web Socket
 */
try {

    /**
     * 
     */
    //const SocketIO = require('socket.io');
    //const io = SocketIO(server);
    //const processIO = require('./src/sockets/io')(io);

} catch(error) {
    config.Escribir(`SOCKET - ${error}`, "error");
}