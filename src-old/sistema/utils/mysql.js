const mysql = require('mysql');
const {promisify} = require('util');
const config = require('../../../config.json');

module.exports = class connMysql
{
    constructor(data = config.BaseDatos)
    {
        this.credenciales = data;
        this.conn = null;
    }

    conectar()
    {
        let conn = mysql.createPool( this.credenciales );
        conn.query = promisify(conn.query).bind(conn); 
        this.conn = conn;
    }

    desconectar()
    {
        if(this.conn != null) {
            this.conn.end();
            this.conn = null;
        }
    }

    consultar(query)
    {
        if(this.conn == null) {
            return new Promise((resolve, reject) => {
                reject("Conexión no iniciada.");
            });
        }

        return new Promise((resolve, reject) => {
            this.conn.getConnection((err, connection) => {
                if(err)
                {
                    reject(`Error de conexion:\n\tCode: ${err.code}\n\tAddress: ${err.address}:${err.port}`);
                }
                else
                {
                    connection.release();
                }
            });
    
            this.conn.query(query, (err, resultados) => {
                if(err)
                {
                    reject(`Error de query:\n\tCode: ${err.code}\n\tMensaje: ${err.sqlMessage}\n\tQuery: ${err.sql}`);
                    return;
                }
                else
                {
                    let salidaText = JSON.stringify(resultados);
                    let salidaJSON = JSON.parse(salidaText);
                    resolve(salidaJSON);
                }
            });
        });
    }

    ejecutar(query)
    {
        if(this.conn == null) {
            return new Promise((resolve, reject) => {
                reject("Conexión no iniciada.");
            });
        }

        return new Promise((resolve, reject) => {
            this.conn.getConnection((err, connection) => {
                if(err)
                {
                    reject(`Error de conexion:\n\tCode: ${err.code}\n\tAddress: ${err.address}:${err.port}`);
                }
                else
                {
                    connection.release();
                }
            });

            this.conn.query(query, (err, resultados) => {
                if(err)
                {
                    reject(`Error de query:\n\tCode: ${err.code}\n\tMensaje: ${err.sqlMessage}\n\tQuery: ${err.sql}`);
                    return;
                }
                else
                {
                    let salidaText = JSON.stringify(resultados);
                    let salidaJSON = JSON.parse(salidaText);
                    resolve(salidaJSON);
                }
            });
        });
    }
}