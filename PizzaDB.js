const mongoose = require('mongoose')

let PizzaSchema = new mongoose.Schema({
    user_id: String,
    size: String,
    crust: String,
    toppings: String,
    order_date: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Pizza', PizzaSchema)