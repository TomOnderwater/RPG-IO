const Func = require("./functions.js")
const PhysicalBody = require('./hitboxes.js')
const Inventory = require('./inventory.js')
const Perception = require('./perception.js')

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
            actions: []
        } //controller input
        this.inventory = new Inventory(6)
        this.session = data.session
        this.name = data.name
        this.hand = {id: 0, 
            item: createItem('none'), 
            body: new PhysicalBody({type: 'circle', pos: data.pos, rad: 0.15}), 
            owner: this.id, 
            moving: false}
        
        // STATS
        this.speedstat = 0.0005
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
        this.status.stamina = 100

        this.stamina = this.status.stamina
        this.health = this.status.vitality

        // UTILITIES
        this.arrows = 100

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
    levelUP()
    {
        this.usedXP += this.status.xp
        //this.xp -= this.calcXPForLevel()
        this.status.level ++
        this.status.points ++
    }
    calcXPForLevel()
    {
        return 100 + (this.status.level - 1) * 50
    }
    getXP()
    {
        return 50
    }
    recover()
    {
        //if (this.xp >= this.calcXPForLevel()) this.levelUP()
        if (this.health < this.status.vitality) this.health += 1
        if (this.stamina < this.status.stamina) this.stamina += 5
    }
    addXP(xp)
    {
        console.log('gained', xp, 'XP points')
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
        console.log('picking up', item)
        this.inventory.add(item)
        //items.forEach(item => this.inventory.add(item))
        this.inventory.updated = true
    }
    removeItem(item)
    {
        console.log('removing:', item)
        this.inventory.remove(item)
    }
    update(level, colliders)
    {
        this.level = level

        //get the ground surface
        let surfacespeed = level.getGroundSpeed(this.body.pos)
        
        this.body.bounceSpeed(Func.multiply(this.input.dir, surfacespeed))
        this.body.update(level.closeBodies(this.body.pos, colliders, 1))

        this.handlePhysical(this.input.hand)
        // integrate into
        if (this.hand.moving && this.hand.item.physical)
        {
            let closebodies = level.closeBodies(this.hand.body.pos, colliders, 1)
            let collisions = this.hand.body.update(closebodies, this.body) // except player body
            if (collisions)
            {
                if (collisions.length)
                {
                    for (let collision of collisions)
                    {
                        if (collision.entity.health !== undefined)
                            level.addEvent(Func.calcAttack({
                                collision, 
                                item: this.hand.item, 
                                attacker: this.id, 
                                power: 1 + (this.status.strength * 0.2)}))
                    }
                }
            }
        }

    }
    applyDamage(damage, attacker)
    {
        this.health -= damage
        this.lastattacker = attacker
        //console.log('ouch, said', this.name, 'as he got hit for ', damage, 'damage, health: ', this.health)
    }
    getScore()
    {
        return {id : this.id, name: this.name, score: this.status.xp}
    }
    data() 
        {
            let pos = Func.fixPos(this.body.pos, 2)
            return {i: this.id, 
                t: this.type, 
                p: pos, 
                n: this.name, 
                h: this.health, 
                H: this.status.vitality}
        }
    getHand()
    {
        return {
            i: this.hand.id, 
            t: this.hand.item.type, 
            p: this.hand.body.pos, 
            m: this.hand.moving, 
            o: this.hand.owner}
    }
    resetHand(type)
    {
        this.hand.item = createItem(type)
        this.hand.moving = false
    }
    shoot(_dir, power)
    {
        let item = this.hand.item
        // check ammo before shooting:

        // get direction of the arrow and add it
        let dir = Func.multiply(_dir, power)
        if (Func.magnitude(_dir) > item.minimumdraw)
        {
            if (!this.inventory.canRemove({type: item.type, count: 1}))
                return
            // remove ammo (based on shot type)
            this.inventory.remove({type: item.type, count: 1})
            this.level.addRangedAttack(
                {
                    owner: this, 
                    pos: this.body.pos, 
                    attack: item.attack, 
                    dir, rad: 0.1, mass: 2,
                    type: ARROW
                })
            }
    }
    handlePhysical(input)
    {
        //if (Func.magnitude)
        let hand = this.hand
        let item = hand.item

        if (this.inventory.isUpdated(item))
            this.resetHand(this.inventory.getSelectedType())

        // what to do when input turns to zero physical ends after this loop
        if (Func.zeroVector(input)) 
        {
            if (hand.moving)
            { //hand was moving, what to do?
                if (item.type === BOW)
                    this.shoot(Func.subtract(this.body.pos, hand.body.pos), 1.5)
            }
            hand.moving = false
            hand.body.pos = this.body.pos // follow player pos
            return
        }
        // spawn a new item
        if (!hand.moving) 
            {
                let bounce = item.bounce
                hand.body = new PhysicalBody({type: 'circle', pos: this.body.pos, rad: item.rad, mass: item.mass, bounce})
                hand.moving = true
            }
        // set target
        let target = Func.add(this.body.pos, Func.multiply(input, item.reach))
        hand.body.target(target)
        if (!item.physical) hand.body.update([])
        if (item.building)
            this.level.build(hand) // will try to build
        //console.log(this.hand.body.pos)
    }
    getInventoryUpdate()
    {
        return this.inventory.updates()
    }
    handleInventory(action)
    {
        if (action.selection !== null) 
        {
            this.inventory.select(action.selection)
            let type = this.inventory.getSelectedType()
            this.hand.item = createItem(type)
        }
        this.inventory.updated = true
        //console.log(action)
    }
    manageAttributes(attribute)
    {
        if (this.points <= 0) return
        switch(attribute)
        {
            case 'strength':
            this.strength ++
            this.points --
            break
            case 'speed':
            this.speed ++
            this.speedstat = 0.0005 + (0.0001 * (this.speed - 1))
            this.points --
            break
            case 'vitality':
            this.vitality++
            this.maxhealth = 100 + ((this.vitality - 1) * 50)
            this.health += 50
            this.points --
            break
            default:

            break
        }
    }

    updateInput(input)
    {
        if (input.joy)
            this.input.dir = Func.multiply(Func.constrainVector(input.joy, 128), this.speedstat)
        if (input.hand)
            this.input.hand = Func.constrainVector(input.hand, 128)
        for (let action of input.actions)
        {
            if (action.type == 'inventory') this.handleInventory(action)
            if (action.type == 'allocation') this.manageAttributes(action.attribute)
        }
    }
}