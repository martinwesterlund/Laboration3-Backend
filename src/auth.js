// Add connection details
const pool = require('../sql/connectionPool.js')





async function loginCust(loginData){

    
    let userDetails = {}
    return new Promise((resolve, reject) => {
        
        pool((err, connection) => {

            connection.query(`SELECT * FROM customers WHERE 1 `, (error, result, fields) => {
                
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

async function loginProd(loginData){
    let userDetails = {}
    return new Promise((resolve, reject) => {
        
        pool((err, connection) => {

            connection.query(`SELECT * FROM producers WHERE 1 `, (error, result, fields) => {
                
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

async function loginCustomer(loginData, socket) {
    try {
        let data = await loginCust(loginData)
        console.log(data)

        socket.emit('LoggedInAsCustomer', data)
    } catch (err) {
        console.log(err)
        socket.emit('LoggedInAsCustomer', err)
    }

}
async function loginProducer(loginData, socket) {
    try {
        let data = await loginProd(loginData)
        console.log(data)
        socket.emit('LoggedInAsProducer', data)
    } catch (err) {
        console.log(err)
        socket.emit('LoggedInAsProducer', err)
    }

}



module.exports = {loginCustomer, loginProducer}