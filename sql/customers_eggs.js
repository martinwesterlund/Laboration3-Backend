// Add connection details
const pool = require('./connectionPool.js')


// Hämta ägg från SQL-databasen
async function getEggsSql(eggdata) {

    let data = []
    let candy = []
    let candydata = {}
   

        for(let i = 0; i < eggdata.mongo.length; i++) {
            if(eggdata.mongo[i][0].candy) {
            
                for (let q = 0; q < eggdata.mongo[i][0].candy.length; q++) {

                    candydata =  await getEggsSqlQuery(eggdata.mongo, i, q) 
                    candy[q] = {...candydata}
                }
            } 
            data[i] = candy.slice()
        }
        return data

}

async function getEggsSqlQuery(eggdata, i, q) {
    let data = {}
 
    return new Promise((resolve, reject) => {
    

        if (eggdata[i][0].candy[q].candy_producers_id > 0) {

            pool((err, connection) => {

                    connection.query(`SELECT * FROM candy 
                                    JOIN candy_producers ON candy.id = candy_producers.candy_id
                                    WHERE candy_producers.id = ` + eggdata[i][0].candy[q].candy_producers_id, (error, result, fields) => {
        
                    if (error) throw error
                    // console.log(result)
                    connection.release()
                        data.id = result[0].id
                        data.name = result[0].name
                        data.category = result[0].category
                        data.color = result[0].color
                        data.price_per_unit = result[0].price_per_unit
                    resolve(data)
                })

            })
        } else {
            resolve(data)
        }
    })
}
    

// Hämta alla MongoID från SQL-Databasen

async function getMongoIds(id) {
    let data = []
 
    return new Promise((resolve, reject) => {
        
        pool((err, connection) => {

                connection.query(`SELECT * FROM easter_eggs WHERE customer_id = ` + connection.escape(id), (error, result, fields) => {
    
                if (error) throw error
                connection.release()
                if(result.length < 1) {
                    data = 0
                } else {
                    for (let i = 0; i < result.length; i++ ){
                        data[i] = result[i].mongo_id
                    }
                }
                resolve(data)
            })

        })
          
    })
}
    
// Skapa nytt ägg i SQL-databasen
async function createNewEgg(eggInfo) {
 
    return new Promise((resolve, reject) => {
        console.log(eggInfo)
        eggInfo.newMongoId = String(eggInfo.newMongoId)
        pool((err, connection) => {

            connection.query(`INSERT INTO easter_eggs (customer_id, mongo_id) VALUES ( ?, ?)`, [eggInfo.customerId, eggInfo.newMongoId], (error, result, fields) => {
                connection.release()
                if (error) throw error
    
                resolve(eggInfo.newMongoId)
            })

        })
          
    })
}

// Ta bort Ägg i SQL-databasen
async function deleteEgg(id) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            connection.query(`DELETE FROM easter_eggs WHERE mongo_id = ` + connection.escape(id), (error, result, fields) => {
                connection.release()
                if (error) reject(error)   
                resolve(true)
            })
        })
    })
}


module.exports = {getEggsSql, getMongoIds, createNewEgg, deleteEgg}