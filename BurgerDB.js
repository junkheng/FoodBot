const mongoose = require('mongoose')

let BurgerSchema = new mongoose.Schema({
    user_id: String,
    size: String,
    meat: String,
    sauce: String,
    order_date: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Burger', BurgerSchema)