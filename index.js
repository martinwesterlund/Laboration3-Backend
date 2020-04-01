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
app.use('/', candy_producers.router)

async function getCandiesFromProducer(socket){
    let producerCandies = await candy_producers.getCandies(2)
    // console.log(producerCandies)
    socket.emit('onProducerEnter', producerCandies)
}

async function getAllCandy(socket){
    let allProducersCandy = await candy_producers.getAllCandy()
    // console.log(allProducersCandy)
    socket.emit('onCustomerEnter', allProducersCandy)
}

async function test(socket){
    let eggdata = await easterEggs.getEggs() 
    // console.log(eggdata)
    socket.emit('onEnter', eggdata)
}

async function getEgg(id){
    console.log("now here!")
    let eggdata = await easterEggs.getEgg(id) 
    // console.log(eggdata)
    socket.emit('Egg', eggdata)
}


io.on('connection', (socket) => {
    test(socket)
    getCandiesFromProducer(socket)
    getAllCandy(socket)
    // Välkomst meddelande vid upprättande av kontakt
    console.log("A new connection is established")
})

io.on("deleteEgg", (id) => {

    
    let done = easterEggs.deleteEgg(id)
    let eggdata = easterEggs.getEggs()
    if (done) {
        io.emit('EggDeleted', eggdata)
    }

})

io.on("getEgg", ( id) => {
    console.log("here we are!")
    getEgg(id)
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