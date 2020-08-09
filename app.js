/**
 * 
 */
const path = require('path');
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

/**
 * 
 */
app.use(cors());
// app.use(morgan('dev'));

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