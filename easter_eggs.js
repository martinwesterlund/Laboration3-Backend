const candy_producers = require('./sql/candy_producers.js')
const costumers_eggs = require('./sql/costumers_eggs.js')

const express = require('express')
const url = require('url')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const mongodbClient = require('mongodb').MongoClient
let ObjectId = require('mongodb').ObjectId // Behövs för att söka efter _id.
let mongoUrl = `mongodb+srv://labb3admin:labb3@labb3-r7qod.mongodb.net/test`

app.use(bodyParser.json())
app.use(express.static('./public'))


app.use(express.urlencoded({
    extended: true
}))

app.use('/producer', candy_producers)
app.use('/costumer', costumers_eggs)





io.on('connection', (socket) => {
    // Välkomst meddelande vid upprättande av kontakt
    socket.emit('hello', { hello: 'Hello!!'})
    console.log("A new connection is established")

    
    })
    
app.get('/producer', (req, res) => {

    // let username = url.parse(req.url, true).query.username
    // let password = url.parse(req.url, true).query.password

    // if (username === 'Berra' && password === 'lol') {
        res.sendFile(__dirname + '/public/producer.html')
})
app.get('/consumer', (req, res) => {

    // let username = url.parse(req.url, true).query.username
    // let password = url.parse(req.url, true).query.password

    // if (username === 'Berra' && password === 'lol') {
        res.sendFile(__dirname + '/public/consumer.html')
})


//Get all easter eggs
app.get('/eggs', (req, res) => {
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

//Get one easter egg
app.get('/eggs/:eggId', (req, res) => {
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

server.listen(8081, () => {
    console.log("MongoDB på 8081")
})