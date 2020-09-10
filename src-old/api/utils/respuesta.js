module.exports = {
    /**
     * 
     */
    respAPI: () =>
    {
        return {
            error: {
                status: false,
                mensaje: ''
            },
            cuerpo: []
        };
    },

    /**
     * 
     * @param {*} e 
     */
    errorAPI: (e) =>
    {
        return {
            error: {
                status: true,
                mensaje: e
            },
            cuerpo: e
        };
    }
}