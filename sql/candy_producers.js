// Add connection details
const pool = require('./connectionPool.js')

// Fix Express 
const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()


async function getProducersCandy(pId, category, sortBy) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            let whereClause = `WHERE producer_id = ${pId}`
            if (pId == 0 && category == 0) {
                whereClause = 'WHERE 1'
            } else if (pId != 0 && (category != 0 && category != undefined)) {
                whereClause = `WHERE producer_id = ${pId} AND category = "${category}"`
            } else if (pId == 0 && category != 0) {
                whereClause = `WHERE category = "${category}"`
            }


            let sortByClause
            switch (sortBy) {
                case undefined:
                    sortByClause = 'candy.name'
                    break
                case 'candy1':
                    sortByClause = 'candy.name'
                    break
                case 'candy2':
                    sortByClause = 'candy.name DESC'
                    break
                case 'price1':
                    sortByClause = 'candy_producers.price_per_unit'
                    break
                case 'price2':
                    sortByClause = 'candy_producers.price_per_unit DESC'
            }

            connection.query(
                `SELECT candy.id AS "id", candy.name AS "name", candy.category AS "category", candy.color AS "color", producers.name as "producer", candy_producers.price_per_unit AS "price", candy_producers.balance as "balance"  
                FROM candy
                LEFT JOIN candy_producers ON candy.id = candy_producers.candy_id
                LEFT JOIN producers on producers.id = candy_producers.producer_id 
                ${whereClause} ORDER BY ${sortByClause}`, (error, result, fields) => {
                connection.release()
                if (error) throw reject(error)
                resolve(result)
            });

        })
    })
}

async function getFilteredCandy(mongoData, id, category, sortBy) {
    let candyData = {}
    candyData.mongo = mongoData
    candyData.sql = await getProducersCandy(id, category, sortBy)

    return candyData

}

async function getPivotCandy(mongoData, sortBy) {
    let candyData = {}
    if (mongoData) {
        candyData.mongo = mongoData
    } else {
        candyData.mongo = []
    }
    candyData.sql = await getSqlCandy(sortBy)

    return candyData

}

async function getSqlCandy(sortBy) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            let sortByClause = 'candy.name'
            switch (sortBy) {
                case 'candy1':
                    sortByClause = 'candy.name'
                    break
                case 'candy2':
                    sortByClause = 'candy.name DESC'
                    break
                case 'price1':
                    sortByClause = 'candy_producers.price_per_unit'
                    break
                case 'price2':
                    sortByClause = 'candy_producers.price_per_unit DESC'
            }
            connection.query(
                `SELECT candy.id AS "id", candy.name AS "name", candy.category AS "category", candy.color AS "color", producers.name as "producer", candy_producers.price_per_unit AS "price", candy_producers.balance as "balance"  
                FROM candy
                LEFT JOIN candy_producers ON candy.id = candy_producers.candy_id
                LEFT JOIN producers on producers.id = candy_producers.producer_id
                WHERE 1 ORDER BY ${sortByClause}`, (error, result, fields) => {
                connection.release()
                if (error) throw reject(error)
                resolve(result)
            });

        })
    })
}

async function removeFromBalance(candyID, amount) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {

            connection.query(
                `UPDATE candy_producers SET balance = balance - ${amount}
                WHERE candy_id = ${candyID}`, (error, result, fields) => {
                connection.release()
                if (error) throw reject(error)
                resolve(true)
            });

        })
    })
}

async function removeFromBalanceMultiple(candyData) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            let values = []
            let whenClause = ''
            let whereClause = ''


            for (let row in candyData) {
                values.push(candyData[row])
            }

            for (let i = 0; i < values.length; i++) {
                whenClause += `WHEN ${values[i].id} THEN ${values[i].newBalance} `
                if (i == values.length - 1) {
                    whereClause += `${values[i].id}`
                } else {
                    whereClause += `${values[i].id}, `
                }

            }

            let sql =
                `UPDATE candy_producers SET balance = CASE id
			    ${whenClause}
			    ELSE balance
		        END
                WHERE id IN (${whereClause})`
            
            connection.query(
                sql, (error, result, fields) => {
                connection.release()
                if (error) throw reject(error)
                resolve(true)
            });

        })
    })
}

async function addToBalance(candyID, amount) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {

            connection.query(
                `UPDATE candy_producers SET balance = balance + ${amount}
                WHERE candy_id = ${candyID}`, (error, result, fields) => {
                connection.release()
                if (error) throw reject(error)
                resolve(true)
            });

        })
    })
}



async function addNewCandySort(newCandyData) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            connection.query(`INSERT INTO candy (name, category, color) VALUES ( ?, ?, ?)`, [newCandyData.name, newCandyData.category, newCandyData.color], (error, result, fields) => {
                // connection.release()
                if (error) throw error
                let candyId = result.insertId

                connection.query(`INSERT INTO candy_producers (candy_id, producer_id, price_per_unit, balance) VALUES ( ?, ?, ?, ?)`, [candyId, newCandyData.id, newCandyData.price, newCandyData.amount], (error, result, fields) => {
                    connection.release()
                    if (error) throw reject(error)
                    resolve(true)


                })

            })
        })
    })
}

async function deleteCandySort(id) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            connection.query(`DELETE FROM candy WHERE id = ` + connection.escape(id), (error, result, fields) => {
                // connection.release()
                if (error) throw error

                connection.query(`DELETE FROM candy_producers WHERE candy_id = ` + connection.escape(id), (error, result, fields) => {
                    connection.release()
                    if (error) throw reject(error)
                    resolve(true)

                })

            })
        })
    })
}
async function updateCandySort(candyInfo) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {

            connection.query("UPDATE candy SET `name` = ?, `category` = ?, `color` = ? WHERE id = " + connection.escape(candyInfo.candyid),
                [candyInfo.name, candyInfo.category, candyInfo.color], (error, result, fields) => {
                    if (error) throw error

                    connection.query("UPDATE candy_producers SET `price_per_unit` = ?, `balance` = ? WHERE candy_id = " + connection.escape(candyInfo.candyid),
                        [candyInfo.price, candyInfo.balance], (error, result, fields) => {
                            connection.release()
                            if (error) throw reject(error)

                            resolve(true)
                        })
                })
        })
    })
}

async function getAllCandyIds() {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            connection.query(`SELECT id, balance FROM candy_producers WHERE 1`, (error, result, fields) => {
                connection.release()
                if (error) reject(error)
                resolve(result)
            })
        })
    })
}



// async function getAllCandy(mongoData) {

//     // console.log("från async: " + mongoData)
//     return new Promise((resolve, reject) => {
//         pool((err, connection) => {
//             connection.query(
//                 `SELECT candy.id AS ID, candy.name AS "Candy", candy.category AS "Category", candy.color AS "Color", producers.name as "Producer", candy_producers.price_per_unit AS "Price" 
//                 FROM candy
//                 LEFT JOIN candy_producers ON candy.id = candy_producers.candy_id
//                 LEFT JOIN producers on producers.id = candy_producers.producer_id
//                 WHERE 1`, (error, result, fields) => {
//                 connection.release()
//                 if (error) throw reject(error)
//                 resolve(result)
//             });

//         })
//     })
// }


// ------------------------ Producer table ------------------------------------------

// Add a new one producer
// router.route('/new')

//     .post((req, res, next) => {
//         pool((err, connection) => {
//             connection.query(`INSERT INTO producers (name, address) VALUES ( ?, ?)`, [req.body.name, req.body.address], (error, result, fields) => {
//                 connection.release()
//                 if (error) throw error
//                 res.send("Added new producer")
//             })
//         })
//     })

// CRUD on one producer 
// router.route('/:id')

//     .get((req, res, next) => {
//         pool((err, connection) => {
//             connection.query(`SELECT * FROM producers WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
//                 connection.release()
//                 if (error) throw error
//                 res.json(result)
//             })
//         })
//     })

//     .put((req, res, post) => {
//         pool((err, connection) => {

//             connection.query("UPDATE producers SET `name` = ?, `address` = ? WHERE id = " + connection.escape(req.params.id),
//                 [req.body.name, req.body.address], (error, result, fields) => {
//                     connection.release()
//                     if (error) throw error
//                     res.send("Updated producer with id: " + req.params.id + " with following values => Name: " + req.body.name + ", Address: " + req.body.address)
//                 })
//         })
//     })

//     .delete((req, res, next) => {
//         pool((err, connection) => {
//             connection.query(`DELETE FROM producers WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
//                 connection.release()
//                 if (error) throw error
//                 res.send("Deleted producer: " + req.params.id)

//             })
//         })
//     })


// ------------------------- Candy table ---------------------------------


router.route('/producer')
    .get((req, res) => {
        res.sendFile('producer.html', { root: './public' })
    })

router.route('/customer')
    .get((req, res) => {
        res.sendFile('customer.html', { root: './public' })
    })

// // Add a new candy
// router.route('/candy/new')

//     .post((req, res, next) => {

//     })

// CRUD on one sort of candy 
router.route('/candy/:id')

    .get((req, res, next) => {
        pool((err, connection) => {
            connection.query(`SELECT * FROM candy WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.json(result)
            })
        })
    })

    .put((req, res, post) => {
        pool((err, connection) => {

            connection.query("UPDATE candy SET `name` = ?, `category` = ?, `color` = ? WHERE id = " + connection.escape(req.params.id),
                [req.body.name, req.body.category, req.body.color], (error, result, fields) => {
                    connection.release()
                    if (error) throw error
                    res.send("Updated a candy with id: " + req.params.id + " with following values => Name: " + req.body.name + ", category: " + req.body.category + ", color: " + req.body.color)
                })
        })
    })

    .delete((req, res, next) => {
        pool((err, connection) => {
            connection.query(`DELETE FROM candy WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Deleted candy with id: " + req.params.id)

            })
        })
    })



// -------------------- candy_producer table -------------------------------------


// Add a new relation between candy and producer
router.route('/junction/')

    .post((req, res, next) => {
        pool((err, connection) => {
            connection.query(`INSERT INTO candy_producers (candy_ID, producer_ID, price_per_unit, balance) VALUES ( ?, ?, ?, ?)`, [req.body.candy_ID, req.body.producer_ID, req.body.price_per_unit, req.body.balance], (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Added realtions and info")
            })
        })
    })

// CRUD on one sort of candy 
router.route('/junction/:id')

    .get((req, res, next) => {
        pool((err, connection) => {
            connection.query(`SELECT * FROM candy_producers WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.json(result)
            })
        })
    })

    .put((req, res, post) => {
        pool((err, connection) => {

            connection.query("UPDATE candy_producers SET `candy_ID` = ?, `producer_ID` = ?, `price_per_unit` = ?, `balance` = ? WHERE id = " + connection.escape(req.params.id),
                [req.body.candy_ID, req.body.producer_ID, req.body.price_per_unit, req.body.balance], (error, result, fields) => {
                    connection.release()
                    if (error) throw error
                    res.send("Updated a candy_producers with id: " + req.params.id + " with following values => candy_ID: " + req.body.candy_ID + ", producer_ID: " + req.body.porducer_ID + ", price_per_unit: " + req.body.price_per_unit + ", balance: " + req.body.balance)
                })
        })
    })

    .delete((req, res, next) => {
        pool((err, connection) => {
            connection.query(`DELETE FROM candy_producers WHERE id = ` + connection.escape(req.params.id), (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Deleted candy_producer relation with id: " + req.params.id)

            })
        })
    })




module.exports = { router, getProducersCandy, getPivotCandy, getFilteredCandy, addNewCandySort, deleteCandySort, updateCandySort, removeFromBalance, addToBalance, getAllCandyIds, removeFromBalanceMultiple }