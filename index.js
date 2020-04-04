const candy_producers = require('./sql/candy_producers.js')
const customers_eggs = require('./sql/customers_eggs.js')
const easterEggs = require('./mongodb/easterEggs.js')
const auth = require('./sql/auth.js')

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
async function getAllEggs(socket, id) {
    let eggdata = {}
    let mongo = []

    eggdata.mongoIds = await customers_eggs.getMongoIds(id)
    if (eggdata.mongoIds === 0) {
        socket.emit('Eggs', "You have no eggs")
    } else {
        for( let i = 0; i < eggdata.mongoIds.length; i++ ){
        mongo[i] = await easterEggs.getEggMongo(eggdata.mongoIds[i])
        }
        eggdata.mongo = mongo

        eggdata.Sql = await customers_eggs.getEggsSql(eggdata)
        socket.emit('Eggs', eggdata)
    }
}


//Funktioner till Producer
async function getCandiesFromProducer(socket, id) {
    let producerCandies = await candy_producers.getProducersCandy(id)
    console.log('Id är ' + id)
    console.log('Datan är : ' + producerCandies)
    socket.emit('onProducerEnter', producerCandies)
}

//Funktioner till Customer
async function getAllCandy(socket, id) {
    let mongo = await easterEggs.getEggMongo(id)
    
    let candyData = await candy_producers.getPivotCandy(mongo[0].candy)
    // console.log(candyData)
    socket.emit('showAllCandy', candyData)
}

async function getFilteredList(socket, id, category, mongoId) {
    if (id == 0 && category == 0) {
        getAllCandy(socket, mongoId)
    }
    else {
        let mongo = await easterEggs.getEggMongo(mongoId)
        console.log(`id är ${id} och category är ${category}`)
        let filteredList = await candy_producers.getFilteredCandy(mongo[0].candy, id, category)
        socket.emit('showFilteredList', filteredList)
    }
}

//Socket stuff
io.on('connection', (socket) => {
    socket.emit('onConnection', 'Connected to server')



    // getAllEggs(socket)

    // //Denna ska skicka med socket + inloggad producers id (2 är bara som exempel)
    // getCandiesFromProducer(socket, 2)
    // getAllCandy(socket)

    // Välkomst meddelande vid upprättande av kontakt
    console.log("A new connection is established")

    socket.on('getProducerView', (id) => {
        console.log('ID på efterfrågad producer är: ' + id)
        getCandiesFromProducer(socket, id)
    })

    socket.on('getFilteredCandyList', (producerId, category, mongoId) => {
        getFilteredList(socket, producerId, category, mongoId)
    })

    socket.on('getEggs', (id) => {
        getAllEggs(socket, id)
    })

    socket.on('showEgg', (id) => {
        console.log('Mongo id är ' + id)
        getAllCandy(socket, id)
    })

    socket.on("deleteEgg", (id) => {

        let done = easterEggs.deleteEgg(id)
        let eggdata = easterEggs.getEggs()
        if (done) {
            io.emit('EggDeleted', eggdata)
        }
    })


    // Authentication stuff

    socket.on('loginCustomer', (loginData) => {

        loginCustomer(loginData, socket)


    })
    socket.on('loginProducer', (loginData) => {

        loginProducer(loginData, socket)

    })

})

async function loginCustomer(loginData, socket) {
    try {
        let data = await auth.loginCustomer(loginData)
        console.log(data)

        socket.emit('LoggedInAsCustomer', data)
    } catch (err) {
        console.log(err)
        socket.emit('LoggedInAsCustomer', err)
    }

}
async function loginProducer(loginData, socket) {
    try {
        let data = await auth.loginProducer(loginData)
        console.log(data)
        socket.emit('LoggedInAsProducer', data)
    } catch (err) {
        console.log(err)
        socket.emit('LoggedInAsProducer', err)
    }

}

server.listen(8081, () => {
    console.log("MongoDB på 8081")
})