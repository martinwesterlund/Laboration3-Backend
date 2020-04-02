const candy_producers = require('./sql/candy_producers.js')
const customers_eggs = require('./sql/customers_eggs.js')
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
app.use('/producer', candy_producers.router)
app.use('/customer', customers_eggs.router)
app.use('/', candy_producers.router)


//Funktioner till Eggs
async function getAllEggs(socket){
    
    let eggdata = {}
    eggdata.mongo = await easterEggs.getEggs()
    
    eggdata.Sql = await customers_eggs.getEggsSql(eggdata.mongo) 
    socket.emit('Egg', eggdata)

}

// async function getEgg(socket, id){
//     let eggdata = {}

//     eggdata.mongo = await easterEggs.getEggMongo(id) 
//     console.log("here!")
//     console.log(eggdata.candy)
//     eggdata.Sql = await customers_eggs.getEggsSql(eggdata.mongo) 
  
//     socket.emit('OneEgg', eggdata)
// }

//Funktioner till Producer
async function getCandiesFromProducer(socket, id){
    let producerCandies = await candy_producers.getProducersCandy(id)
    // console.log(producerCandies)
    socket.emit('onProducerEnter', producerCandies)
}

//Funktioner till Customer
async function getAllCandy(socket){
    let allProducersCandy = await candy_producers.getAllCandy()
    // console.log(allProducersCandy)
    socket.emit('onCustomerEnter', allProducersCandy)
}

async function getFilteredList(socket, id){
    let filteredList = await candy_producers.getProducersCandy(id)
    socket.emit('onCustomerEnter', filteredList)
}


io.on('connection', (socket) => {
    getAllEggs(socket)

    //Denna ska skicka med socket + inloggad producers id (2 är bara som exempel)
    getCandiesFromProducer(socket, 2)
    getAllCandy(socket)

    // Välkomst meddelande vid upprättande av kontakt
    console.log("A new connection is established")

    socket.on('getFilteredCandyList', (id) => {
        getFilteredList(socket, id)
    })

    socket.on('getEgg', (id) => {
        getEgg(socket, id)
    })

    
    socket.on("deleteEgg", (id) => {

        let done = easterEggs.deleteEgg(id)
        let eggdata = easterEggs.getEggs()
        if (done) {
            io.emit('EggDeleted', eggdata)
        }
    })
})






// app.get('/producer', (req, res) => {

//     // let username = url.parse(req.url, true).query.username
//     // let password = url.parse(req.url, true).query.password

//     // if (username === 'Berra' && password === 'lol') {
//     res.sendFile(__dirname + '/public/producer.html')
// })
// app.get('/consumer', (req, res) => {

//     // let username = url.parse(req.url, true).query.username
//     // let password = url.parse(req.url, true).query.password

//     // if (username === 'Berra' && password === 'lol') {
//     res.sendFile(__dirname + '/public/consumer.html')
// })


server.listen(8081, () => {
    console.log("MongoDB på 8081")
})