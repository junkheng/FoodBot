const dotenv = require('dotenv')
dotenv.config()
const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const Markup = require('telegraf/markup')

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { leave } = Stage

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/foodbot')
    .then(() => console.log('connection successful'))
    .catch((err) => console.log(err))

let user_id = ''


// General Markups for inline selection
const foodOption = Markup.inlineKeyboard([
    Markup.callbackButton('🍕', 'pizza'),
    Markup.callbackButton('🍔', 'burger'),
    Markup.callbackButton('❌', 'quit')
]).extra()

// Lobby Scene
const lobby = new Scene('lobby')
lobby.enter((ctx) => ctx.reply(`Welcome ${ctx.message.from.first_name}! \n/pizza to order your pizza \n/burger to begin ordering your burger`)
    .then(console.log(ctx.message.from))
    .then(user_id = ctx.message.from.id)
    .then(bot.action('pizza', (ctx) => ctx.scene.enter('orderPizza')))
    .then(bot.action('burger', (ctx) => ctx.scene.enter('orderBurger')))
    .then(bot.action('quit', (ctx) => ctx.reply('See you next time!\n/start to wake me up 😎'))))


// Pizza Ordering Scene
const Pizza = require('./PizzaDB')
const orderPizza = new Scene('orderPizza')
orderPizza.state = {
    user_id: user_id,
    size: [/personal/gi, /regular/gi, /large/gi],
    crust: [/thin/gi, /NY/gi, /cheesy/gi],
    toppings: [/pepperoni/gi, /sausage/gi, /chicken/gi, /beef/gi],
    container: []
}

const pizzaSize = Markup.inlineKeyboard([
    Markup.callbackButton('Personal', 'Personal'),
    Markup.callbackButton('Regular', 'Regular'),
    Markup.callbackButton('Large', 'Large')
]).extra()

const pizzaCrust = Markup.inlineKeyboard([
    Markup.callbackButton('Thin', 'Thin'),
    Markup.callbackButton('NY', 'NY'),
    Markup.callbackButton('Cheesy', 'Cheesy')
]).extra()

const pizzaToppings = Markup.inlineKeyboard([
    Markup.callbackButton('🍕', 'Pepperoni'),
    Markup.callbackButton('🌭', 'Sausage'),
    Markup.callbackButton('🐓', 'Chicken'),
    Markup.callbackButton('🐄', 'Beef'),
]).extra()

orderPizza.enter((ctx) => ctx.reply('Please select a size', pizzaSize)
    .then(user_id = user_id)
    // .then(console.log(user_id))
    // .then(user_id = ctx.message.from.id)
    .then(orderPizza.state.container = []))

orderPizza.action(orderPizza.state.size, (ctx) => ctx.editMessageText(`Size selected: ${ctx.match.input} \nPlease select crust type`, pizzaCrust)
    .then(orderPizza.state.container.push(ctx.match.input)))
orderPizza.action(orderPizza.state.crust, (ctx) => ctx.editMessageText(`Crust selected: ${ctx.match.input} \nPlease select toppings`, pizzaToppings)
    .then(orderPizza.state.container.push(ctx.match.input)))
orderPizza.action(orderPizza.state.toppings, (ctx) => ctx.reply(`Order complete!`)
    .then(orderPizza.state.container.push(ctx.match.input))
    .then(ctx.editMessageText(`Pizza Order Summary \nSize: ${orderPizza.state.container[0]} \nCrust: ${orderPizza.state.container[1]}\nToppings: ${orderPizza.state.container[2]}`))
    .then(Pizza.create({ user_id: user_id, size:orderPizza.state.container[0], crust:orderPizza.state.container[1], toppings:orderPizza.state.container[2]}, (err, post) => {
        if (err) {
            console.log('saving to db failed')
            return
        }
    }))
    .then(ctx.reply(`Anything else? \n/pizza to order your pizza \n/burger to begin ordering your burger`))
    .then(orderPizza.leave())
    .then(bot.action('pizza', (ctx) => ctx.scene.enter('orderPizza')))
    .then(bot.action('burger', (ctx) => ctx.scene.enter('orderBurger'))))
    // .then(bot.action('quit', (ctx) => ctx.reply('See you next time!\n/start to wake me up 😎'))))


// Burger Ordering Scene
const Burger = require('./BurgerDB')
const orderBurger = new Scene('orderBurger')
orderBurger.state = {
    user_id: user_id,
    size: [/single/gi, /double/gi, /triple/gi],
    meat: [/beef/gi, /chicken/gi, /lamb/gi, /egg/gi],
    sauce: [/homemade/gi, /tomato/gi, /chilli/gi, /mayo/gi],
    container: []
}

const burgerSize = Markup.inlineKeyboard([
    Markup.callbackButton('Single', 'Single'),
    Markup.callbackButton('Double', 'Double'),
    Markup.callbackButton('Triple', 'Triple')
]).extra()

const burgerMeat = Markup.inlineKeyboard([
    Markup.callbackButton('🐑', 'Lamb'),
    Markup.callbackButton('🍳', 'Egg'),
    Markup.callbackButton('🐓', 'Chicken'),
    Markup.callbackButton('🐄', 'Beef')
]).extra()

const burgerSauce = Markup.inlineKeyboard([
    Markup.callbackButton('Home', 'Homemade'),
    Markup.callbackButton('Chilli', 'Chilli'),
    Markup.callbackButton('Tomato', 'Tomato'),
    Markup.callbackButton('Mayo', 'Mayo')
]).extra()


orderBurger.enter((ctx) => ctx.reply(`Please select your stack`, burgerSize)
    .then(user_id = user_id)
    // .then(console.log(user_id))
    .then(orderBurger.state.container = []))

orderBurger.action(orderBurger.state.size, (ctx) => ctx.editMessageText(`Stack selected: ${ctx.match.input} \nPlease select meat type`, burgerMeat)
    .then(orderBurger.state.container.push(ctx.match.input)))
orderBurger.action(orderBurger.state.meat, (ctx) => ctx.editMessageText(`Meat selected: ${ctx.match.input} \nPlease choose your sauce`, burgerSauce)
    .then(orderBurger.state.container.push(ctx.match.input)))
orderBurger.action(orderBurger.state.sauce, (ctx) => ctx.reply(`Order complete!`)
    .then(orderBurger.state.container.push(ctx.match.input))
    .then(ctx.editMessageText(`Burger Order Summary: \nA ${orderBurger.state.container[0]} stack ${orderBurger.state.container[1]} burger with ${orderBurger.state.container[2]} sauce.`))
    .then(Burger.create({ user_id: user_id, size:orderBurger.state.container[0], meat:orderBurger.state.container[1], sauce:orderBurger.state.container[2]}, (err, post) => {
        if (err) {
            console.log('saving to db failed')
            return
        }
    }))
    .then(orderBurger.leave())
    .then(ctx.reply(`Anything else? \n/pizza to order your pizza \n/burger to begin ordering your burger`))
    .then(bot.action('pizza', (ctx) => ctx.scene.enter('orderPizza')))
    .then(bot.action('burger', (ctx) => ctx.scene.enter('orderBurger'))))
    // .then(bot.action('quit', (ctx) => ctx.reply('See you next time!\n/start to wake me up 😎'))))


// Scene Manager
const stage = new Stage()
stage.command('cancel', leave())

// Scene Registration
stage.register(orderPizza, orderBurger, lobby)

// Bot Initiation

bot.use(session())
bot.use(stage.middleware())
bot.command('pizza', (ctx) => ctx.scene.enter('orderPizza'))
bot.command('burger', (ctx) => ctx.scene.enter('orderBurger'))
bot.command('lobby', (ctx) => ctx.scene.enter('lobby'))

bot.start((ctx) => ctx.scene.enter('lobby'))

bot.startPolling()