// Add connection details
const pool = require('./connectionPool.js')





async function loginCustomer(loginData){

    
    let userDetails = {}
    return new Promise((resolve, reject) => {
        
        pool((err, connection) => {

            connection.query(`SELECT * FROM customers WHERE 1 ` /*name = ` + connection.escape(loginData.username) + 'AND password = ' + connection.escape(loginData.password)*/, (error, result, fields) => {
                
                if (error) throw error
                connection.release()

                for ( i = 0; i < result.length; i++) {
                    

                    if ( loginData.username === result[i].name && loginData.password === result[i].password){

                        userDetails.id = result[i].id
                        userDetails.name = result[i].name
                        userDetails.password = result[i].password
                        userDetails.loggedIn = true
                        break

                    }

                }
                if(userDetails.loggedIn){
                    resolve (userDetails)
                } else {
                    console.log("Wrong username or password ")
                    userDetails.loggedIn = false
                    return userDetails
                }
                    

            })
          
        })
    })

}

async function loginProducer(){








}


module.exports = {loginCustomer, loginProducer}