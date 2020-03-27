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


app.use('/eggs', easterEggs)
app.use('/producer', candy_producers)
app.use('/costumer', costumers_eggs)

io.on('connection', (socket) => {
    // Välkomst meddelande vid upprättande av kontakt
    socket.emit('hello', { hello: 'Hello!!' })
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


server.listen(8081, () => {
    console.log("MongoDB på 8081")
})