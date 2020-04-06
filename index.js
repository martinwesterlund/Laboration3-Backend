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

async function addCandySort(socket, newCandyData){

    let done = await candy_producers.addNewCandySort(newCandyData)
    getCandiesFromProducer(socket, newCandyData.id)
}
async function deleteCandySort(socket, id){

    let done = await candy_producers.deleteCandySort(id.candy)
    getCandiesFromProducer(socket, id.producer)
}
async function updateCandySort(socket, candyInfo){
    console.log(candyInfo)

    let done = await candy_producers.updateCandySort(candyInfo)
    getCandiesFromProducer(socket, candyInfo.producerid)
}



//Funktioner till Customer
async function getAllCandy(socket, id) {
    let mongo = await easterEggs.getEggMongo(id)
    
    let candyData = await candy_producers.getPivotCandy(mongo[0].candy)
    //console.log(candyData)

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
async function deleteEgg(socket, id) {


    await easterEggs.deleteEgg(id)
    await customers_eggs.deleteEgg(id)

    socket.emit('eggDeleted', true)

}


async function addCandyToEgg(socket, candyId, candy, mongoId){
    
    let candyAddedToEgg = await easterEggs.updateEgg(candy, mongoId)
    
    let balanceDecreased = await candy_producers.removeFromBalance(candyId)
    
    
    if(balanceDecreased && candyAddedToEgg){
        getAllCandy(socket, mongoId)
    }
}

async function removeCandyFromEgg(socket, candyId, candy, mongoId){
    
    let candyRemovedFromEgg = await easterEggs.updateEgg(candy, mongoId)
    
    let balanceIncreased = await candy_producers.addToBalance(candyId)
    
    
    if(balanceIncreased && candyRemovedFromEgg){
        getAllCandy(socket, mongoId)
    }
}

//Socket stuff
io.on('connection', (socket) => {

    // Välkomst meddelande vid upprättande av kontakt
    socket.emit('onConnection', 'Connected to server')
    console.log("A new connection is established")


    // producer stuff


    socket.on('getProducerView', (id) => {
        console.log('ID på efterfrågad producer är: ' + id)
        getCandiesFromProducer(socket, id)
    })

    socket.on('addnewCandySort', (newCandyData) => {

        addCandySort(socket, newCandyData)

    })

    socket.on('deleteCandySort', (id) => {

        deleteCandySort(socket, id)
    })
    socket.on('updateCandySort', (candyinfo) => {

        updateCandySort(socket, candyinfo)

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

    // socket.on('getFilteredCandyList', (id, mongoId) => {
    //     getFilteredList(socket, id, mongoId)
    // })


    socket.on("createNewEgg", (eggInfo) => {

        createNewEgg(socket, eggInfo)

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