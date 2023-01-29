const Func = require("../util/functions.js")
const PhysicalBody = require('../util/hitboxes.js')
const Inventory = require('../util/inventory.js')
const Hand = require('./hand.js')
const createItem = require('../items/item.js')

module.exports = class Player
{
    constructor(data, level)
    {
        this.level = level
        this.id = data.id
        this.type = PLAYER
        this.body = new PhysicalBody({type: 'circle', entity: this, pos: data.pos, rad: 0.2})
        this.input = {
            dir: {x: 0, y: 0}, 
            hand: {x: 0, y: 0},
            handbounce: {x: 0, y: 0}, 
            actions: []
        }

        this.invulnerableticks = 150 //about 5 seconds
        // UPDATE
        this.inventory = new Inventory(6)

        //set ammo count to default 10
        this.inventory.ammo = 10
        this.session = data.session
        this.name = data.name
        this.hand = new Hand(this, createItem(NONE), this.body.pos)

        this.speedstat = 0.0006
        this.perceptionstat = 8

        this.maxhealth = data.health || 100
        this.health = this.maxhealth
        this.boostSpeed = this.speedstat * 5

        // UTILITIES
        this.feedback = [] // keeps track of things you're doing

    }
    recover()
    {
        if (this.health < this.maxhealth) this.health += 1
    }
    handleBoost(action)
    {
        this.boost = action
    }
    initHand(id)
    {
        this.hand.id = id
        this.hand.item = createItem(this.inventory.getSelectedType())
    }
    emptyInventory()
    {
        this.inventory.getAll() //also empties
    }
    dead()
    {
        return (this.health <= 0)
    }
    pickup(item)
    {
        this.inventory.updated = true
        return this.inventory.add(item)
    }
    getAmmo()
    {
        return this.inventory.ammo
    }
    removeItem(item)
    {
        //console.log('removing:', item)
        this.inventory.remove(item)
    }
    boosting(surface)
    {
        if (this.boost === undefined) return false
        if (this.boost.boost > 0)
        {
            let spd = Func.multiply(this.boost.dir, this.boostSpeed * surface)
            this.body.bounceSpeed(spd)
            this.boost.boost -= 2
            //console.log('boosting!', spd, this.boost)
            return true
        }
        return false
    }
    update(level, colliders)
    {
        this.level = level

        //get the ground surface
        let surfacespeed = level.getGroundSpeed(this.body.pos)
        // move the body
        if (!this.boosting(surfacespeed))
            this.body.bounceSpeed(Func.multiply(this.input.dir, surfacespeed))
        this.body.update(level.closeBodies(this.body.pos, colliders, 1))

        // move the hand
        this.hand.update(level, colliders)

        if (this.invulnerableticks > 0)
            this.invulnerableticks --

    }
    applyDamage(damage, attacker)
    {
        if (this.invulnerableticks > 0) 
            return
        this.health -= damage
        this.lastattacker = attacker
        //console.log('ouch, said', this.name, 'as he got hit for ', damage, 'damage, health: ', this.health)
    }
    getFeedback()
    {
        return this.hand.item.getFeedBack()
    }
    data() 
        {
            let pos = Func.fixPos(this.body.pos, 2)
            let out = {i: this.id, 
                t: this.type, 
                p: pos, 
                n: this.name, 
                h: this.health, 
                H: this.maxhealth,
                a: this.inventory.getAmmo()}
            if (this.invulnerableticks > 0)
                out.I = '1'
            return out
        }
    
    getHand()
    {
        return this.hand.data()
    } 
    getInventoryUpdate()
    {
        return this.inventory.updates()
    }
    handleInventory(action)
    {
        if (action.selection !== undefined) 
        {
            this.inventory.select(action.selection)
            let type = this.inventory.getSelectedType()
            this.hand.item = createItem(type)
        }
        if (action.swapping !== undefined)
        {
            let item = this.inventory.swap(action.swapping)
            if (item)
            {
                let body = new PhysicalBody({type: 'circle', rad: 0.5, pos: this.body.pos})
                item.pos = this.level.getFreeSpot(this.body.pos, body)
                this.level.placeItem(item)
            }
        }
        // flag
        this.inventory.updated = true
    }
    updateInput(input)
    {
        if (input.dir)
            this.input.dir = Func.multiply(Func.constrainVector(input.dir, 128), this.speedstat)
        if (input.hand)
            this.hand.updateInput(input.hand)
            //this.input.hand = Func.constrainVector(input.hand, 128)
        for (let action of input.actions)
        {
            if (action.type == 'inventory') this.handleInventory(action)
            if (action.type == 'allocation') this.manageAttributes(action.attribute)
            if (action.type == 'boost') this.handleBoost(action)
        }
    }
    getDrop()
    {
        let items = this.inventory.getAll()
        for (let item of items)
        {
            item.pos = this.body.pos
        }
        let bags = Math.round(this.inventory.ammo * 0.0625) + 3
        for (let i = 0; i < bags; i++)
        {
            let drop = {pos: Func.add(this.body.getCenter(), Func.randomVector(0.1))}
            drop.item = {type: AMMO, count: 8}
            items.push(drop)
        }
        return items
    }
}