const candy_producers = require('../sql/candy_producers.js')


//Funktioner till Producer

async function getCandiesFromProducer(socket, id) {
    let producerCandies = await candy_producers.getProducersCandy(id)
    console.log('Id är ' + id)
    console.log('Datan är : ' + producerCandies)
    socket.emit('onProducerEnter', producerCandies)
    
}

async function addCandySort(socket, newCandyData) {

    let done = await candy_producers.addNewCandySort(newCandyData)
    getCandiesFromProducer(socket, newCandyData.id)
}
async function deleteCandySort(socket, id) {

    let done = await candy_producers.deleteCandySort(id.candy)
    getCandiesFromProducer(socket, id.producer)
}
async function updateCandySort(socket, candyInfo, io) {
    console.log(candyInfo)
    console.log(io)

    let done = await candy_producers.updateCandySort(candyInfo)
    getCandiesFromProducer(socket, candyInfo.producerid)
    io.to('customer').emit('updateCandyList', true)
}

module.exports = {getCandiesFromProducer, addCandySort, deleteCandySort, updateCandySort}