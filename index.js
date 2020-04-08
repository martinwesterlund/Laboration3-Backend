const candy_producers = require('./sql/candy_producers.js')
const customers_eggs = require('./sql/customers_eggs.js')
const easterEggs = require('./mongodb/easterEggs.js')
const auth = require('./src/auth.js')
const functions = require('./src/functions.js')

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
        for (let i = 0; i < eggdata.mongoIds.length; i++) {
            mongo[i] = await easterEggs.getEggMongo(eggdata.mongoIds[i])
        }
        eggdata.mongo = mongo
        eggdata.Sql = await customers_eggs.getEggsSql(eggdata)
        socket.emit('Eggs', eggdata)
    }
}




//Funktioner till Customer
async function getAllCandy(socket, id) {
    let mongo = await easterEggs.getEggMongo(id)

    let candyData = await candy_producers.getPivotCandy(mongo[0].candy)
    // console.log(candyData)

    socket.emit('showAllCandy', candyData)
}

async function getFilteredList(socket, id, category, sortBy, mongoId) {
    if (id == 0 && category == 0 && sortBy == 'candy1') {
        getAllCandy(socket, mongoId, sortBy)
    }
    else {
        let mongo = await easterEggs.getEggMongo(mongoId)
        console.log(`id är ${id} och category är ${category}`)
        let filteredList = await candy_producers.getFilteredCandy(mongo[0].candy, id, category, sortBy)
        socket.emit('showFilteredList', filteredList)
    }
}

async function createNewEgg(socket, eggInfo) {

    eggInfo.newMongoId = await easterEggs.createEgg(eggInfo)

    let newEggId = await customers_eggs.createNewEgg(eggInfo)

    socket.emit('newEggCreated', newEggId)

}

async function createRandomEgg(socket, eggInfo) {
    // Lägger tomt ägg i mongodatabasen
    eggInfo.newMongoId = await easterEggs.createEgg(eggInfo)

    // Kopplar det tomma ägget till en customer i tabellen easter_eggs. newEggId är mongoIdt
    let newEggId = await customers_eggs.createNewEgg(eggInfo)
    
    //Hämtar antalet olika godissorter och saldo
    let candyIds = await candy_producers.getAllCandyIds()

    console.log("Antal godisar: " + candyIds.length)
    
    // Skapar random godis
    let randomCandy = []
    let candyData = []
    for (let i = 0; i < 10; i++) {
        let randomElement = Math.floor(Math.random() * candyIds.length)
        let randomAmount
        if (candyIds[randomElement].balance < 5) {
            randomAmount = 2 + Math.floor(Math.random() * candyIds[randomElement].balance)
        } else {
            randomAmount = 2 + Math.floor(Math.random() * 5)
        }
        randomCandy.push({ "candy_producers_id": candyIds[randomElement].id, "amount": randomAmount })
        candyData.push({"id": candyIds[randomElement].id, "newBalance": candyIds[randomElement].balance-randomAmount })
        candyIds.splice(randomElement, 1)
    }

    // Lägger in random godis i mongo-ägget
    let candyAddedToEgg = await easterEggs.updateEgg(randomCandy, newEggId)

    //Ändrar saldot
    let updated = await candy_producers.removeFromBalanceMultiple(candyData)

    if(updated && candyAddedToEgg){
        console.log('Random ägget skapat och saldot ändrat')
        
    }
    socket.emit('newEggCreated', newEggId)

}
async function deleteEgg(socket, id) {


    await easterEggs.deleteEgg(id)
    await customers_eggs.deleteEgg(id)

    socket.emit('eggDeleted', true)

}


async function addCandyToEgg(socket, candyId, candy, mongoId) {

    let candyAddedToEgg = await easterEggs.updateEgg(candy, mongoId)

    let balanceDecreased = await candy_producers.removeFromBalance(candyId, 1)


    if (balanceDecreased && candyAddedToEgg) {
        getAllCandy(socket, mongoId)
    }
}

async function removeCandyFromEgg(socket, candyId, candy, mongoId) {
    console.log(candy)
    let candyRemovedFromEgg = await easterEggs.updateEgg(candy, mongoId)

    let balanceIncreased = await candy_producers.addToBalance(candyId, 1)


    if (balanceIncreased && candyRemovedFromEgg) {
        getAllCandy(socket, mongoId)
    }
}

//Socket stuff
io.on('connection', (socket) => {
   
    // Välkomst meddelande vid upprättande av kontakt
    socket.emit('onConnection', 'Connected to server')
    if(socket.handshake.headers.referer === "http://localhost:8081/producer/") {
        socket.join('producer')
        console.log("A new connection is established, joined Producer Room")
    }
    if(socket.handshake.headers.referer === "http://localhost:8081/eggs/" || socket.handshake.headers.referer === "http://localhost:8081/customer/" ) {
        socket.join('customer')
        console.log("A new connection is established, joined Customer Room")
    }

    socket.on('deal', (data) => {

        socket.to('customer').emit('newDeal', data)


    })


    // producer stuff


    socket.on('getProducerView', (id) => {
        console.log('ID på efterfrågad producer är: ' + id)
        functions.getCandiesFromProducer(socket, id)
    })

    socket.on('addnewCandySort', (newCandyData) => {

        functions.addCandySort(socket, newCandyData)

    })

    socket.on('deleteCandySort', (id) => {

        functions.deleteCandySort(socket, id)
    })
    socket.on('updateCandySort', (candyinfo) => {

        functions.updateCandySort(socket, candyinfo)

    })



    // customer and egg stuff


    socket.on('getEggs', (id) => {
        getAllEggs(socket, id)
    })

    socket.on('showEgg', (id) => {
        console.log('Mongo id är ' + id)
        getAllCandy(socket, id)
    })
    socket.on('getFilteredCandyList', (producerId, category, sortBy, mongoId) => {
        getFilteredList(socket, producerId, category, sortBy, mongoId)
    })



    socket.on("createNewEgg", (eggInfo) => {

        createNewEgg(socket, eggInfo)

    })

    socket.on('createRandomEgg', (eggInfo) => {
        createRandomEgg(socket, eggInfo)
    })

    socket.on("deleteEgg", (id) => {

        deleteEgg(socket, id)

    })

    socket.on('addCandyToEgg', (candyId, candy, mongoId) => {
        addCandyToEgg(socket, candyId, candy, mongoId)
    })

    socket.on('removeCandyFromEgg', (candyId, candy, mongoId) => {
        removeCandyFromEgg(socket, candyId, candy, mongoId)
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