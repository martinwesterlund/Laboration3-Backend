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
router.route('/egg/new')

    .post((req, res, next) => {     
        pool((err, connection) => {
            connection.query(`INSERT INTO easter_eggs (costumer_id, mongo_id) VALUES ( ?, ?)`, [req.body.costumer_id, req.body.mongo_id], (error, result, fields) => {
                connection.release()
                if (error) throw error
                res.send("Added a new easter egg")
            })
        })
    })

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




module.exports = router