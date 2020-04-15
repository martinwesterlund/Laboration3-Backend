// Add connection details
const pool = require('./connectionPool.js')

// Fix Express 
const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()

// Hämta alla godisar för en producent

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
                `SELECT candy.id AS "id", candy_producers.id AS "cpid", candy.name AS "name", candy.category AS "category", candy.color AS "color", producers.name as "producer", candy_producers.price_per_unit AS "price", candy_producers.balance as "balance"  
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

// Hämta filtrerade godisar från SQL-databasen 

async function getFilteredCandy(mongoData, id, category, sortBy) {
    let candyData = {}
    candyData.mongo = mongoData
    candyData.sql = await getProducersCandy(id, category, sortBy)

    return candyData

}

// Hämtar en filtrerad lista med godis.
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
// Hämta alla godisar för en konsument 

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
                `SELECT candy.id AS "id", candy_producers.id AS "cpid", candy.name AS "name", candy.category AS "category", candy.color AS "color", producers.name as "producer", candy_producers.price_per_unit AS "price", candy_producers.balance as "balance"  
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

// Öka lagersaldot på en godis.
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
// Minska lagersaldot på en godis.
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
// Änvänds när man gör ett autogenererat ägg. Minskar saldot på alla de godisar som autofunktionen har lägg till.
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


// Lägg till godis i SQL-databasen
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
// Ta bort godis i SQL-databasen
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

// Uppdatera godissort i SQL-databasen
async function updateCandySort(candyInfo) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            console.log(candyInfo)

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

// Hämta IDn för godis i SQL-databasen
async function getAllCandyIds() {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            connection.query(`SELECT id, candy_id, balance FROM candy_producers WHERE 1`, (error, result, fields) => {
                connection.release()
                if (error) reject(error)
                resolve(result)
            })
        })
    })
}


// ------------------------- Candy table ---------------------------------
// Serverar HTML-filerna 

router.route('/producer')
    .get((req, res) => {
        res.sendFile('producer.html', { root: './public' })
    })

router.route('/customer')
    .get((req, res) => {
        res.sendFile('customer.html', { root: './public' })
    })


module.exports = { router, getProducersCandy, getPivotCandy, getFilteredCandy, addNewCandySort, deleteCandySort, updateCandySort, removeFromBalance, addToBalance, getAllCandyIds, removeFromBalanceMultiple }
