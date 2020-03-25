const express = require('express')
const app = express()
const mongodbClient = require('mongodb').MongoClient
let ObjectId = require('mongodb').ObjectId // Behövs för att söka efter _id.
const bodyParser = require('body-parser')

app.use(bodyParser.json())


app.use(express.urlencoded({
    extended: true
}))

let url = `mongodb+srv://labb3admin:labb3@labb3-r7qod.mongodb.net/test`

const findDocument = function (db, eggId = null, callback) {
    const collection = db.collection('easter_eggs');

    let searchquery = eggId == null ? {} : {
        _id: new ObjectId(eggId)
    }
    // Find some documents
    collection.find(searchquery).toArray(function (err, docs) {
        if (err) throw err
        callback(docs);
    });
}

app.listen(8081, () => {
    console.log("MongoDB på 8081")
})