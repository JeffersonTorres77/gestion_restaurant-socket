const sqlite3 = require('sqlite3').verbose();

/**
 * 
 */
module.exports = class connSQLite3
{
    /**
     * 
     * @param {*} ruta 
     */
    constructor(ruta)
    {
        this.ruta = ruta;
        this.conn = null;

        this.conectar();
    }

    /**
     * 
     */
    conectar()
    {
        this.conn = new sqlite3.Database(this.ruta);
    }

    /**
     * 
     */
    desconectar()
    {
        this.conn.close();
        this.conn = null;
    }

    /**
     * 
     * @param {*} query 
     * @param {*} data 
     */
    async consultar(query, data = [])
    {
        return new Promise(async (resolve, reject) => {
            if(this.conn == null) {
                reject("Conexión no iniciada.");
            }

            await this.conn.all(query, data, (err, rows) => {
                if(err) {
                    reject(err);
                }
    
                let data = [];
                rows.forEach((row) => {
                    data.push(row);
                });

                resolve(data);
            });
        });
    }

    /**
     * 
     * @param {*} query 
     * @param {*} data 
     */
    ejecutar(query, data = [])
    {
        this.conn.run(query, data, (err) => {
            if(err) {
                if(err.errno != 21) throw err;
            }
        });
    }
}