module.exports = (io, socket) => {
    socket.on('cambio-general', () => {
        io.in("MonitoreoPedidos" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCamarero" + socket.datos.objRestaurant.id).emit('cambio');
        io.in("MonitoreoCaja" + socket.datos.objRestaurant.id).emit('cambio');
        socket.emit('status', true);
    });
}