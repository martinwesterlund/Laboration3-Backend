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

//Get all easter eggs
app.get('/', (req, res) => {
    mongodbClient.connect(url, {
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

//Get one easter egg
app.get('/:eggId', (req, res) => {
    mongodbClient.connect(url, {
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

app.listen(8081, () => {
    console.log("MongoDB på 8081")
})