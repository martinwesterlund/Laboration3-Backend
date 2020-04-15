const mysql = require('mysql')

// Skapa en ny connection-pool
let pool = mysql.createPool({
    connectionLimit: 5,
    host: 'remotemysql.com',
    port: 3306,
    user: 'user',
    password: 'pass',
    database: 'db'
})

let connection = (callback) => {
    pool.getConnection((err, connection) => {
        callback(err, connection)
    })
}



module.exports = connection