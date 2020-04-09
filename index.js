const candy_producers = require('./sql/candy_producers.js')
const customers_eggs = require('./sql/customers_eggs.js')
const easterEggs = require('./mongodb/easterEggs.js')
const auth = require('./src/auth.js')
const functions_producer = require('./src/functions_producer.js')
const functions_customer = require('./src/functions_customer.js')

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





//Socket stuff
io.on('connection', (socket) => {
    // Välkomst meddelande vid upprättande av kontakt
    socket.emit('onConnection', 'Connected to server')
    if(socket.handshake.headers.referer === "http://localhost:8081/producer/") {
        socket.join('producer')
        console.log("A new connection is established, joined Producer Room")
    }

    if(socket.handshake.headers.referer === "http://localhost:8081/eggs" ) {
        socket.join('customer')
        console.log("A new connection is established, joined Customer Room")
    }
    
    if(socket.handshake.headers.referer === "http://localhost:8081/customer" ) {
        socket.join('customer')
        console.log("A new connection is established, joined Customer Room")
    }
    socket.on('deal', (data) => {

        socket.to('customer').emit('newDeal', data)


    })


    // producer stuff


    socket.on('getProducerView', (id) => {
        console.log('ID på efterfrågad producer är: ' + id)
        functions_producer.getCandiesFromProducer(socket, id)
    })

    socket.on('addnewCandySort', (newCandyData) => {

        functions_producer.addCandySort(socket, newCandyData)

    })

    socket.on('deleteCandySort', (id) => {

        functions_producer.deleteCandySort(socket, id)
    })
    socket.on('updateCandySort', (candyinfo) => {

        functions_producer.updateCandySort(socket, candyinfo, io)

    })



    // customer and egg stuff


    socket.on('getEggs', (id) => {
        functions_customer.getAllEggs(socket, id)
    })

    

    socket.on('showEgg', (producerId, category, sortBy, mongoId) => {
        functions_customer.getFilteredList(socket, producerId, category, sortBy, mongoId, io)
    })

    
    socket.on('getFilteredCandyList', (producerId, category, sortBy, mongoId) => {
        functions_customer.getFilteredList(socket, producerId, category, sortBy, mongoId, io)
    })



    socket.on("createNewEgg", (eggInfo) => {

        functions_customer.createNewEgg(socket, eggInfo)

    })

    socket.on('createRandomEgg', (eggInfo) => {
        functions_customer.createRandomEgg(socket, eggInfo)
    })

    socket.on("deleteEgg", (id) => {

        functions_customer.deleteEgg(socket, id)

    })

    socket.on('addCandyToEgg', (candyId, candy, mongoId) => {
        functions_customer.addCandyToEgg(socket, candyId, candy, mongoId, io)
    })

    socket.on('removeCandyFromEgg', (candyId, candy, mongoId) => {
        functions_customer.removeCandyFromEgg(socket, candyId, candy, mongoId, io)
    })


    // Authentication stuff

    socket.on('loginCustomer', (loginData) => {

        auth.loginCustomer(loginData, socket)


    })
    socket.on('loginProducer', (loginData) => {

        auth.loginProducer(loginData, socket)

    })

})


server.listen(8081, () => {
    console.log("MongoDB på 8081")
})