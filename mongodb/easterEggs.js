const express = require('express')
const router = express.Router()
const mongodbClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')

let ObjectId = require('mongodb').ObjectId // Behövs för att söka efter _id.
let mongoUrl = `mongodb+srv://labb3admin:labb3@labb3-r7qod.mongodb.net/test`

router.route('/')

//Get all easter eggs
.get((req, res) => {
    mongodbClient.connect(mongoUrl, {
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) throw err
        let db = client.db('Laboration3')
        findDocument(db, null, (result) => {
            client.close()
            res.json(result)
        })
    })
})

//Create new egg
.post((req, res) => {
    mongodbClient.connect(mongoUrl, {
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) throw err
        let db = client.db('Laboration3')
        console.log('DB finns nu')

        console.log(db)

        const collection = db.collection('easter_eggs')

        let document = {}
        for (const key of Object.keys(req.body)) {

            if (key == "value") {
                document[key] = parseInt(req.body[key])
            }
            else {
                document[key] = req.body[key]
            }

        }

        collection.insertOne(document, (err, result) => {
            if (err) throw err
            res.send(result)
        })
    })
})

//Get one easter egg
router.route('/:eggId')
.get((req, res) => {
    mongodbClient.connect(mongoUrl, {
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) throw err
        let db = client.db('Laboration3')
        if (ObjectId.isValid(req.params.eggId)) {
            findDocument(db, req.params.eggId, (result) => {
                client.close()
                res.json(result)
            })
        }
    })
})

const findDocument = function (db, eggId = null, callback) {
    const collection = db.collection('easter_eggs');

    let searchquery = eggId == null ? {} : {
        _id: new ObjectId(eggId)
    }

    collection.find(searchquery).toArray(function (err, docs) {
        if (err) throw err
        callback(docs);
    });
}


module.exports = router
