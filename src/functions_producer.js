const candy_producers = require('../sql/candy_producers.js')


//Funktioner till Producer

// Hämta godistillverkarens godis
async function getCandiesFromProducer(socket, id) {
    let producerCandies = await candy_producers.getProducersCandy(id)
    socket.emit('onProducerEnter', producerCandies)
    
}
// Lägg till en ny godissort
async function addCandySort(socket, newCandyData) {

    let done = await candy_producers.addNewCandySort(newCandyData)
    getCandiesFromProducer(socket, newCandyData.id)
}
// TA bort en godissort
async function deleteCandySort(socket, id) {

    let done = await candy_producers.deleteCandySort(id.candy)
    getCandiesFromProducer(socket, id.producer)
}
// Ändra din godissort
async function updateCandySort(socket, candyInfo, io) {

    let done = await candy_producers.updateCandySort(candyInfo)
    getCandiesFromProducer(socket, candyInfo.producerid)
    io.to('customer').emit('updateCandyList', true)
}

module.exports = {getCandiesFromProducer, addCandySort, deleteCandySort, updateCandySort}