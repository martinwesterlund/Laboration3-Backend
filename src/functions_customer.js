const customers_eggs = require('../sql/customers_eggs.js')
const easterEggs = require('../mongodb/easterEggs.js')
const candy_producers = require('../sql/candy_producers.js')

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
    getTotalEggPrice(socket, candyData)
    socket.emit('showAllCandy', candyData)
}

async function getTotalEggPrice(socket, data) {
    let totalEggPrice = 0
    for (let i = 0; i < data.mongo.length; i++) {
        for (let j = 0; j < data.sql.length; j++) {
            if (data.mongo[i].candy_producers_id == data.sql[j].cpid) {
                totalEggPrice += (data.mongo[i].amount * data.sql[j].price)

            }
        }
    }
    socket.emit('showTotalPrice', totalEggPrice)
}

async function getFilteredList(socket, id, category, sortBy, mongoId) {
    if (id == 0 && category == 0 && sortBy == 'candy1') {
        getAllCandy(socket, mongoId, sortBy)
    }
    else {
        let mongo = await easterEggs.getEggMongo(mongoId)
        let unfilteredList = await candy_producers.getPivotCandy(mongo[0].candy)
        let filteredList = await candy_producers.getFilteredCandy(mongo[0].candy, id, category, sortBy)
        socket.emit('showFilteredList', filteredList)
        getTotalEggPrice(socket, unfilteredList)
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
        candyData.push({ "id": candyIds[randomElement].id, "newBalance": candyIds[randomElement].balance - randomAmount })
        candyIds.splice(randomElement, 1)
    }

    // Lägger in random godis i mongo-ägget
    let candyAddedToEgg = await easterEggs.updateEgg(randomCandy, newEggId)

    //Ändrar saldot
    let updated = await candy_producers.removeFromBalanceMultiple(candyData)

    if (updated && candyAddedToEgg) {
        console.log('Random ägget skapat och saldot ändrat')

    }
    socket.emit('newEggCreated', newEggId)
}

async function deleteEgg(socket, id) {
    await easterEggs.deleteEgg(id)
    await customers_eggs.deleteEgg(id)
    socket.emit('eggDeleted', true)
}

async function addCandyToEgg(socket, candyId, candy, mongoId, io) {
    let candyAddedToEgg = await easterEggs.updateEgg(candy, mongoId)
    let balanceDecreased = await candy_producers.removeFromBalance(candyId, 1)

    if (balanceDecreased && candyAddedToEgg) {
        io.emit('updateCandyList', mongoId)
    }
}

async function removeCandyFromEgg(socket, candyId, candy, mongoId, io) {
    let candyRemovedFromEgg = await easterEggs.updateEgg(candy, mongoId)
    let balanceIncreased = await candy_producers.addToBalance(candyId, 1)

    if (balanceIncreased && candyRemovedFromEgg) {
        //getAllCandy(socket, mongoId, io)
        io.emit('updateCandyList', mongoId)
    }
}

module.exports = { getAllEggs, getAllCandy, getFilteredList, createNewEgg, createRandomEgg, deleteEgg, addCandyToEgg, removeCandyFromEgg }