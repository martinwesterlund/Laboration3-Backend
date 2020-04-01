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
app.use('/costumer', costumers_eggs)

async function test(socket){
    let eggdata = await easterEggs.getEggs() 
    console.log(eggdata)
    socket.emit('onEnter', eggdata)
}

async function getEgg(id){
    console.log("now here!")
    let eggdata = await easterEggs.getEgg(id) 
    console.log(eggdata)
    socket.emit('Egg', eggdata)
}


io.on('connection', (socket) => {
    test(socket)
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