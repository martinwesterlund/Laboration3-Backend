// Add connection details
const pool = require('./connectionPool.js')

// Fix Express 
const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()



// ------------------------ Costumer table ------------------------------------------

// Add a new one Costumer
router.route('/new')

    .post((req, res, next) => {     
        pool((err, connection) => {
            connection.query(`INSERT INTO costumers (name) VALUES ( ?`, [req.body.name], (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Added new costumer")
            })
        })
    })

// CRUD on one costumer 
router.route('/:id')

    .get((req, res, next) => {     
        pool((err, connection) => {
            connection.query(`SELECT * FROM costumers WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.json(result)
            })
        })
    })

    .put((req, res, post) => {
        pool((err, connection) => {

            connection.query("UPDATE costumers SET `name` = ? WHERE id = " + connection.escape(req.params.id), 
            [req.body.name, req.body.address], (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Updated costumers with id: " + req.params.id + " with following values => Name: " + req.body.name)
            })
        })
    })

    .delete((req, res, next) => {
        pool((err, connection) => {
            connection.query(`DELETE FROM costumers WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Deleted costumer: " + req.params.id)
                
            })
        })
    })


// ------------------------- Easter egg table ---------------------------------


// Add a new candy
// router.route('/egg/new')

//     .post((req, res, next) => {     
//         pool((err, connection) => {
//             connection.query(`INSERT INTO easter_eggs (costumer_id, mongo_id) VALUES ( ?, ?)`, [req.body.costumer_id, req.body.mongo_id], (error, result, fields) => {
//                 connection.release()
//                 if (error) throw error
//                 res.send("Added a new easter egg")
//             })
//         })
//     })


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
        console.log(eggdata)

        if (eggdata[i][0].candy[q].candy_producers_id > 0) {

            pool((err, connection) => {

                    connection.query(`SELECT * FROM candy 
                                    JOIN candy_producers ON candy.id = candy_producers.candy_id
                                    WHERE candy.id = ` + eggdata[i][0].candy[q].candy_producers_id, (error, result, fields) => {
        
                    if (error) throw error
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
    

// Get MongoID:s for all eggs with customer id of *

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


    



// CRUD on one Easter egg 
router.route('/egg/:id')

    .get((req, res, next) => {     
        pool((err, connection) => {
            connection.query(`SELECT * FROM easter_eggs WHERE costumer_id = ` + connection.escape(req.params.id), (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.json(result)
            })
        })
    })

    .put((req, res, post) => {
        pool((err, connection) => {

            connection.query("UPDATE easter_eggs SET `costumer_id` = ?, `mongo_id` = ? WHERE id = " + connection.escape(req.params.id), 
            [req.body.name, req.body.category, req.body.color], (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Updated a easter_egg with id: " + req.params.id + " with following values => costumer_id: " + req.body.costumer_id + ", mongo_id: " + req.body.mongo_id)
            })
        })
    })

    .delete((req, res, next) => {
        pool((err, connection) => {
            connection.query(`DELETE FROM easter_eggs WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Deleted easter_egg with id: " + req.params.id)
                
            })
        })
    })




module.exports = {router, getEggsSql, getMongoIds, createNewEgg, deleteEgg}