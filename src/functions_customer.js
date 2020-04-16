const customers_eggs = require('../sql/customers_eggs.js')
const easterEggs = require('../mongodb/easterEggs.js')
const candy_producers = require('../sql/candy_producers.js')

//Funktioner till Eggs
async function getAllEggs(socket, id) {
    let eggdata = {}
    let mongo = []

    // Kollar om du har några ägg om så skicka ägg-data till webbläsaren
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

// Visar allt godis när du klickar dig in i ett ägg
async function getAllCandy(socket, id) {
    let mongo = await easterEggs.getEggMongo(id)
    let candyData = await candy_producers.getPivotCandy(mongo[0].candy)
    getTotalEggPrice(socket, candyData)
    socket.emit('showAllCandy', candyData)
}

// Räknar ut totalpriset på ett ägg
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

// Hämtar en filtrerad lista med godissorter
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
// Skapa ett nytt ägg
async function createNewEgg(socket, eggInfo) {
    eggInfo.newMongoId = await easterEggs.createEgg(eggInfo)
    let newEggId = await customers_eggs.createNewEgg(eggInfo)
    socket.emit('newEggCreated', newEggId)
}

// Skapar ett nytt autogenererat ägg
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
            randomAmount = Math.floor(Math.random() * candyIds[randomElement].balance)
        } else {
            randomAmount = 2 + Math.floor(Math.random() * 5)
        }
        randomCandy.push({ "candy_producers_id": candyIds[randomElement].id, "amount": randomAmount })
        candyData.push({ "id": candyIds[randomElement].id, "newBalance": candyIds[randomElement].balance - randomAmount })
        candyIds.splice(randomElement, 1)
    }

    // Lägger in random godis i mongo-ägget
    await easterEggs.updateEgg(randomCandy, newEggId)

    //Ändrar saldot
    await candy_producers.removeFromBalanceMultiple(candyData)

    socket.emit('newEggCreated', newEggId)
}

// Ta bort ett ägg
async function deleteEgg(socket, id) {
    await easterEggs.deleteEgg(id)
    await customers_eggs.deleteEgg(id)
    socket.emit('eggDeleted', true)
}

// Lägg till godis i ditt valda ägg
async function addCandyToEgg(socket, candyId, candy, mongoId, io) {
    let candyAddedToEgg = await easterEggs.updateEgg(candy, mongoId)
    let balanceDecreased = await candy_producers.removeFromBalance(candyId, 1)

    if (balanceDecreased && candyAddedToEgg) {
        io.emit('updateCandyList', mongoId)
    }
}

// Ta bort godis i ditt valda ägg
async function removeCandyFromEgg(socket, candyId, candy, mongoId, io) {
    let candyRemovedFromEgg = await easterEggs.updateEgg(candy, mongoId)
    let balanceIncreased = await candy_producers.addToBalance(candyId, 1)

    if (balanceIncreased && candyRemovedFromEgg) {
        io.emit('updateCandyList', mongoId)
    }
}

// Uppdatera namnet på ditt ägg
async function updateEggName(socket, newNameData){
    await easterEggs.updateEggName(newNameData)
    socket.emit('eggNameUpdated', true)
}

module.exports = { getAllEggs, getAllCandy, getFilteredList, createNewEgg, createRandomEgg, deleteEgg, addCandyToEgg, removeCandyFromEgg, updateEggName }