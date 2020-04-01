const candy_producers = require('./sql/candy_producers.js')
const costumers_eggs = require('./sql/costumers_eggs.js')
const easterEggs = require('./mongodb/easterEggs.js')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use(bodyParser.json())
app.use(express.static('./public'))
app.use(express.urlencoded({
    extended: true
}))


app.use('/eggs', easterEggs.router)
app.use('/producer', candy_producers)
app.use('/costumer', costumers_eggs.router)

async function getAllEggs(socket){
    
    let eggdata = {}
    eggdata.mongo = await easterEggs.getEggs() 
    eggdata.Sql = await costumers_eggs.getEggSql(eggdata.mongo) 
    socket.emit('onEnter', eggdata)
}

async function getEgg(id){
    let eggdata = {}

    eggdata.Mongo = await easterEggs.getEggMongo(id) 
    eggdata.Sql = await costumers_eggs.getEggSql(eggdata.Mongo) 
    socket.emit('Egg', eggdata)
}


io.on('connection', (socket) => {
    getAllEggs(socket)
    // Välkomst meddelande vid upprättande av kontakt
    console.log("A new connection is established")


    socket.on('getEgg', (id) => {
        console.log("here we are!")
        getEgg(id)
    })

    
    socket.on("deleteEgg", (id) => {

        let done = easterEggs.deleteEgg(id)
        let eggdata = easterEggs.getEggs()
        if (done) {
            io.emit('EggDeleted', eggdata)
        }
    })
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


server.listen(8081, () => {
    console.log("MongoDB på 8081")
})