/**
 * 
 */
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

/**
 * 
 */
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-COntrol-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('port', process.env.PORT || 3000);

const router = require('./src/api/router')(app);

/**
 * 
 */
const server = app.listen(app.get('port'), () => {
    // console.log("Servidor funcionando en el puerto", app.get('port'));
});

/**
 * 
 */
const SocketIO = require('socket.io');
const io = SocketIO(server);
const processIO = require('./src/sockets/io')(io);