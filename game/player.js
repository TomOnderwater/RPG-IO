const Func = require("./functions.js")
const PhysicalBody = require('./hitboxes.js')
const Inventory = require('./inventory.js')
const Hand = require('./hand.js')
const createItem = require('./item.js')

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
        this.session = data.session
        this.name = data.name
        this.hand = new Hand(this, createItem(NONE), this.body.pos)
        
        // alt method this.hand = new Hand(this)
        // STATS
        this.speedstat = 0.0006
        this.perceptionstat = 8
        this.heading = 0

        // STATUS
        this.status = {}
        this.status.xp = 0
        this.status.level = 1
        this.status.points = 1
        //ATTRIBUTES
        this.status.strength = 1
        this.status.speed = 1
        this.status.vitality = data.health || 100

        this.health = this.status.vitality
        this.boostSpeed = this.speedstat * 5

        // UTILITIES
        this.feedback = [] // keeps track of things you're doing

        //pos, angle, fov, resolution, range
        //this.perception = new Perception(Math.PI / 2, 10, 6)
    }
    getStatusData()
    {
        let xpnext = 100 //this.calcXPForLevel()
        let xp = this.status.xp
        return { 
            xp, xpnext,
            points: this.status.points,
            level: this.status.level,
            strength: this.status.strength,
            vitality: this.status.vitality,
            speed: this.status.speed
        }
    }
    getXP()
    {
        return 50
    }
    recover()
    {
        //if (this.xp >= this.calcXPForLevel()) this.levelUP()
        if (this.health < this.status.vitality) this.health += 1
    }
    handleBoost(action)
    {
        this.boost = action
    }
    addXP(xp)
    {
        this.status.xp += xp
    }
    initHand(id)
    {
        this.hand.id = id
        this.hand.item = createItem(this.inventory.getSelectedType())
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
        if (!this.invulnerableticks) 
            return
        this.health -= damage
        this.lastattacker = attacker
        //console.log('ouch, said', this.name, 'as he got hit for ', damage, 'damage, health: ', this.health)
    }
    getScore()
    {
        return {id : this.id, name: this.name, score: this.status.xp}
    }
    getFeedback()
    {
        return this.hand.item.getFeedBack()
    }
    data() 
        {
            let pos = Func.fixPos(this.body.pos, 2)
            return {i: this.id, 
                t: this.type, 
                p: pos, 
                n: this.name, 
                h: this.health, 
                H: this.status.vitality,
                a: this.inventory.getAmmo()}
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
        //console.log('dropping:', items)
        return items
    }
}