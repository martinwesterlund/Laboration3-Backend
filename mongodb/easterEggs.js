const express = require('express')
const router = express.Router()
const mongodbClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')
const loginDetails = require('../src/mongo_user.js')

let ObjectId = require('mongodb').ObjectId


let mongoUrl = `mongodb+srv://${loginDetails.user}:${loginDetails.password}@labb3-r7qod.mongodb.net/test`



router.route('/')

    // Skicka eggs.html till webbläsaren
    .get((req, res) => {

        res.sendFile("eggs.html", { root: './public' })

    })

    // Skapa ett nytt ägg i Mongo
    async function createEgg(eggInfo) {
        return new Promise((resolve, reject) => {
            mongodbClient.connect(mongoUrl, {
                useUnifiedTopology: true
            }, (err, client) => {
                if (err) throw err
                let db = client.db('Laboration3')
                const collection = db.collection('easter_eggs')
    
                collection.insertOne({name: eggInfo.eggName, candy: [{ candy_producers_id: 0 , amount: 0 } ]}, (err, result) => {
                    if (err) reject(err)
                    resolve(result.ops[0]._id)
                })
            })
        })
    }
    


// Hämta alla ägg från Mongo
async function getEggs() {

    return new Promise((resolve, reject) => {

        mongodbClient.connect(mongoUrl, {
            useUnifiedTopology: true
        }, (err, client) => {
            if (!err) {
                let db = client.db('Laboration3')
                findDocument(db, null, (result) => {
                    client.close()

                    resolve(result)
                })
            } else {
                reject(err)
            }
        })
    })
}


// Hämta all information om ett specifikt ägg i Mongo
async function getEggMongo(id) {

    return new Promise((resolve, reject) => {
        mongodbClient.connect(mongoUrl, {
            useUnifiedTopology: true
        }, (err, client) => {
            if (!err) {
                let db = client.db('Laboration3')
                findDocument(db, id, (result) => {

                    client.close()
                    
                    resolve(result)
                })
            } else {
                reject(err)
            }
        })
    })
}

// Uppdatera ett ägg i Mongo

async function updateEgg(candy, mongoId) {
    return new Promise((resolve, reject) => {
        mongodbClient.connect(mongoUrl, {
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) throw err
            let db = client.db('Laboration3')
            if (ObjectId.isValid(mongoId)) {
                
                findAndUpdateDocument(db, mongoId, candy, (result) => {
                    client.close()
                    resolve(true)
                })
            }

            
        })
    })
}

// Ta bort ägg i Mongo

async function deleteEgg(id) {

    mongodbClient.connect(mongoUrl, {
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) throw err
        let db = client.db('Laboration3')
        if (ObjectId.isValid(id)) {
            findAndDeleteDocument(db, id, (result) => {
                client.close()
                return true
            })
        }
    })
}

async function updateEggName(newNameData){
    return new Promise((resolve, reject) => {
        mongodbClient.connect(mongoUrl, {
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) throw err
            let db = client.db('Laboration3')
            if (ObjectId.isValid(newNameData.id)) {
                
                findAndUpdateName(db, newNameData, (result) => {
                    client.close()
                    resolve(true)
                })
            }

            
        })
    })
}



// Hämta data i Mongo
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

// Uppdatera i Mongo
const findAndUpdateDocument = function (db, eggId, body, callback) {
    const collection = db.collection('easter_eggs')
    


    let selectionCriteria = {
        _id: new ObjectId(eggId)
    }

    let updatedData = {
        $set: {
            candy: body
        }
    }

    collection.findOneAndUpdate(selectionCriteria, updatedData, (err, docs) => {
        if (err) throw err
        callback(docs)
    })
}

const findAndUpdateName = function (db, newNameData, callback) {
    const collection = db.collection('easter_eggs')
    


    let selectionCriteria = {
        _id: new ObjectId(newNameData.id)
    }

    let updatedData = {
        $set: {
            name: newNameData.name
        }
    }

    collection.findOneAndUpdate(selectionCriteria, updatedData, (err, docs) => {
        if (err) throw err
        callback(docs)
    })
}

// Ta bort i Mongo
const findAndDeleteDocument = function (db, eggId, callback) {
    const collection = db.collection('easter_eggs')

    let deleteQuery = {
        _id: ObjectId(eggId)
    }

    collection.findOneAndDelete(deleteQuery, (err, docs) => {
        if (err) throw err
        callback(docs)
    })
}





module.exports = { router, deleteEgg, getEggs, getEggMongo, updateEgg, createEgg, updateEggName }
