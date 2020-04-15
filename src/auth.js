// Add connection details
const pool = require('../sql/connectionPool.js')


// Logga in antingen costumer eller producer, enda skillnaden är SQL-frågan, i övrigt anropas samma kod.

async function loginCustomer(loginData, socket) {
    try {
        const sqlQuery = `SELECT * FROM customers WHERE 1 `
        let data = await login(loginData, sqlQuery)

        socket.emit('LoggedInAsCustomer', data)
    } catch (err) {
        console.log(err)
        socket.emit('LoggedInAsCustomer', err)
    }

}
async function loginProducer(loginData, socket) {
    try {
        const sqlQuery = `SELECT * FROM producers WHERE 1 `
        let data = await login(loginData, sqlQuery)
        socket.emit('LoggedInAsProducer', data)
    } catch (err) {
        console.log(err)
        socket.emit('LoggedInAsProducer', err)
    }

}


async function login(loginData, sqlQuery){

    let userDetails = {}
    return new Promise((resolve, reject) => {
        
        pool((err, connection) => {

            connection.query(sqlQuery, (error, result, fields) => {
                
                if (error) throw error
                connection.release()

                for ( let i = 0; i < result.length; i++) {
                    

                    if ( loginData.username === result[i].name && loginData.password === result[i].password){

                        userDetails.id = result[i].id
                        userDetails.name = result[i].name
                        userDetails.password = result[i].password
                        userDetails.loggedIn = true
                        userDetails.message = "You are logged in =)"
                        break

                    }

                }
                if(userDetails.loggedIn){
                    resolve(userDetails)
                } else {
                    userDetails.loggedIn = false
                    userDetails.message = "Wrong username or password"
                    reject(userDetails)
                }
                    

            })
          
        })
    })

}

module.exports = { loginCustomer, loginProducer }