module.exports = {
    /**
     * 
     */
    resp: (objContent) => {
        return {
            error: {
                status: false,
                mensaje: ""
            },
            cuerpo: objContent
        };
    },

    /**
     * 
     */
    error: (objContent) => {
        return {
            error: {
                status: true,
                mensaje: objContent
            },
            cuerpo: objContent
        };
    }
}