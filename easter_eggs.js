const candy_producers = require('./sql/candy_producers.js')
const costumers_eggs = require('./sql/costumers_eggs.js')

const express = require('express')

const mongodbClient = require('mongodb').MongoClient
let ObjectId = require('mongodb').ObjectId // Behövs för att söka efter _id.
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())


app.use(express.urlencoded({
    extended: true
}))

app.use('/producer', candy_producers)
app.use('/costumer', costumers_eggs)


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