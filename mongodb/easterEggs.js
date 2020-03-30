const express = require('express')
const router = express.Router()
const mongodbClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')

let ObjectId = require('mongodb').ObjectId // Behövs för att söka efter _id.
let mongoUrl = `mongodb+srv://labb3admin:labb3@labb3-r7qod.mongodb.net/test`


function deleteEgg(id) {

    mongodbClient.connect(mongoUrl, {
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) throw err
        let db = client.db('Laboration3')
        if(ObjectId.isValid(id)){
            findAndDeleteDocument(db, id, (result) => {
                client.close()
            return true
            })
        }
    })
}

function getEggs() {

        mongodbClient.connect(mongoUrl, {
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) throw err
            let db = client.db('Laboration3')
            findDocument(db, null, (result) => {
                client.close()
    
                return result 
    
            })
        })

 
}


router.route('/')

    // //Get all easter eggs
    .get((req, res) => {
        // mongodbClient.connect(mongoUrl, {
        //     useUnifiedTopology: true
        // }, (err, client) => {
        //     if (err) throw err
        //     let db = client.db('Laboration3')
        //     findDocument(db, null, (result) => {
        //         client.close()
                // res.json(result)
                res.sendFile("eggs.html", {root: './public'})
        //     })
        // })
    })

    //Create new egg
    .post((req, res) => {
        mongodbClient.connect(mongoUrl, {
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) throw err
            let db = client.db('Laboration3')
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


router.route('/:eggId')

    //Get one easter egg
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

    //Delete one easter egg
    .delete((req, res) => {
        mongodbClient.connect(mongoUrl, {
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) throw err
            let db = client.db('Laboration3')
            if(ObjectId.isValid(req.params.eggId)){
                findAndDeleteDocument(db, req.params.eggId, (result) => {
                    client.close()
                    res.json(result)
                })
            }
        })
    })

    //Update easter egg
    .put((req, res) => {
        mongodbClient.connect(mongoUrl, {
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) throw err
            let db = client.db('Laboration3')
            if(ObjectId.isValid(req.params.eggId)){
                findAndUpdateDocument(db, req.params.eggId, req.body, (result) => {
                    client.close()
                    res.json(result)
                })
            }
        })
    })


// Find document(s) method
const findDocument = function (db, eggId = null, callback) {
    const collection = db.collection('easter_eggs');

    let searchQuery = eggId == null ? {} : {
        _id: new ObjectId(eggId)
    }

    collection.find(searchQuery).toArray(function (err, docs) {
        if (err) throw err
        callback(docs);
    });
}

// Update document
const findAndUpdateDocument = function(db, eggId, body, callback) {
    const collection = db.collection('easter_eggs')

    let selectionCriteria = {
        _id: new ObjectId(eggId)
    }

    let updatedData = { $set: {
        candy : body.candy
      }
    }

    collection.findOneAndUpdate(selectionCriteria, updatedData, (err, docs) => {
        if (err) throw err
        callback(docs)
    })
}
// Delete document
const findAndDeleteDocument = function(db, eggId, callback) {
    const collection = db.collection('easter_eggs')

    let deleteQuery = {
        _id : ObjectId(eggId)
    }

    collection.findOneAndDelete(deleteQuery, (err, docs) => {
        if (err) throw err
        callback(docs)
    })
}





module.exports = {router, deleteEgg, getEggs}
