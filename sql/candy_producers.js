// Add connection details
const pool = require('./connectionPool.js')

// Fix Express 
const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()


async function getProducersCandy(pId) {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            connection.query(
                `SELECT candy.id AS ID, candy.name AS "Candy", candy.category AS "Category", candy.color AS "Color", producers.name as "Producer", candy_producers.price_per_unit AS "Price", candy_producers.balance AS "Balance" 
                FROM candy
                LEFT JOIN candy_producers ON candy.id = candy_producers.candy_id
                LEFT JOIN producers on producers.id = candy_producers.producer_id
                WHERE producer_id = ${pId}`, (error, result, fields) => {
                connection.release()
                if (error) throw reject(error)
                resolve(result)
            });

        })
    })
}

async function getAllCandy() {
    return new Promise((resolve, reject) => {
        pool((err, connection) => {
            connection.query(
                `SELECT candy.id AS ID, candy.name AS "Candy", candy.category AS "Category", candy.color AS "Color", producers.name as "Producer", candy_producers.price_per_unit AS "Price" 
                FROM candy
                LEFT JOIN candy_producers ON candy.id = candy_producers.candy_id
                LEFT JOIN producers on producers.id = candy_producers.producer_id
                WHERE 1`, (error, result, fields) => {
                connection.release()
                if (error) throw reject(error)
                resolve(result)
            });

        })
    })
}


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

// Add a new candy
router.route('/candy/new')

    .post((req, res, next) => {
        pool((err, connection) => {
            connection.query(`INSERT INTO candy (name, category, color) VALUES ( ?, ?, ?)`, [req.body.name, req.body.category, req.body.color], (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Added a new candy")
            })
        })
    })

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




module.exports = { router, getProducersCandy, getAllCandy }