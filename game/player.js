const Func = require("./functions.js")
const PhysicalBody = require('./hitboxes.js')
const Inventory = require('./inventory.js')
const Perception = require('./perception.js')

module.exports = class Player
{
    constructor(data, dungeon)
    {
        this.level = dungeon
        this.id = data.id
        this.type = 'player'
        this.body = new PhysicalBody({type: 'circle', entity: this, pos: data.pos, rad: 0.2})
        this.input = {dir: {x: 0, y: 0}, actions: []} //controller input
        this.inventory = new Inventory(6)
        this.session = data.session
        this.name = data.name
        this.hand = {id: 0, item: createItem('none'), body: new PhysicalBody({type: 'circle', pos: data.pos, rad: 0.15}), owner: this.id, moving: false}
        this.speedstat = 0.0005
        this.perceptionstat = 10
        this.maxhealth = data.health || 100
        this.heading = 0

        // STATUS
        this.xp = 0
        this.level = 1
        this.usedXP = 0
        this.points = 0
        //ATTRIBUTES
        this.strength = 1
        this.speed = 1
        this.vitality = 1

        this.stamina = 100
        this.maxstamina = 100

        //pos, angle, fov, resolution, range
        //this.perception = new Perception(Math.PI / 2, 10, 6)
        this.health = this.maxhealth
    }
    getStatusData()
    {
        let xpnext = this.calcXPForLevel()
        let xp = this.xp
        return { 
            xp, xpnext,
            level: this.level,
            points: this.points,
            strength: this.strength,
            vitality: this.vitality,
            speed: this.speed
        }
    }
    levelUP()
    {
        this.usedXP += this.xp
        this.xp -= this.calcXPForLevel()
        this.level ++
        this.points ++
    }
    calcXPForLevel()
    {
        return 100 + (this.level - 1) * 50
    }
    getXP()
    {
        return (this.xp + this.usedXP) * 0.5
    }
    recover()
    {
        if (this.xp >= this.calcXPForLevel()) this.levelUP()
        if (this.health < this.maxhealth) this.health += 1
        if (this.stamina < this.maxstamina) this.stamina += 5
    }
    addXP(xp)
    {
        console.log('gained', xp, 'XP points')
        this.xp += xp
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
    pickup(items)
    {
        console.log(items)
        items.forEach(item => this.inventory.add(item))
        this.inventory.updated = true
    }

    update(level, colliders)
    {
        // rotate sprite
        if (Func.magnitude(this.body.speed) > 0.01)
            this.heading = Math.atan2(this.body.speed.y, this.body.speed.x)

        this.body.bounceSpeed(this.input.dir)
        this.body.update(level.closeBodies(this.body.pos, colliders, 1))
        // update sword / fist with everything but not own body
        if (this.hand.moving)
        {
            let closebodies = level.closeBodies(this.hand.body.pos, colliders, 1)
            let collisions = this.hand.body.update(closebodies, this.body) // except player body
            if (collisions)
            {
                if (collisions.length)
                {
                    for (let collision of collisions)
                    {
                        // calculate damage based on speed times damage
                        let itemdamage = this.hand.item.physical
                        let speed = Func.magnitude(collision.speed)
                        let damage = speed * itemdamage * (1 + (this.strength * 0.2))
                        damage = Math.round(damage)
                        // apply damage
                        if (collision.entity.health !== undefined)
                            collision.entity.applyDamage(damage, this)
                        // add to visual
                        level.addEvent({
                            type: 'damage', 
                            dir: collision.speed, 
                            pos: collision.pos, 
                            damage, 
                            item: this.hand.item.type
                            })
                    }
                }
            }
        }
    }
    applyDamage(damage, attacker)
    {
        this.health -= damage
        this.lastattacker = attacker.id
        //console.log('ouch, said', this.name, 'as he got hit for ', damage, 'damage, health: ', this.health)
    }
    getScore()
    {
        return this.xp + this.usedXP
        //return {type: 'game over', name: this.name, score: 100}
    }
    sees(pos)
    {
        return (pos.x >= this.body.pos.x - this.perceptionstat && pos.x <= this.body.pos.x + this.perceptionstat &&
        pos.y >= this.body.pos.y - this.perceptionstat && pos.y <= this.body.pos.y + this.perceptionstat)
    }
    data() 
        {
            let x = Func.fixNumber(this.body.pos.x, 2)
            let y = Func.fixNumber(this.body.pos.y, 2)
            let pos = {x,y}
            return {id: this.id, type: this.type, pos, name: this.name, health: this.health, maxhealth: this.maxhealth}
        }
    getHand()
    {
        return {id: this.hand.id, type: this.hand.item.type, pos: this.hand.body.pos, moving: this.hand.moving, owner: this.hand.owner}
    }
    handlePhysical(action)
    {
        // beginning, or middle of the touch, init the item box
        if (action.action == 'touch') 
        {
            this.hand.moving = false
            return
        }
        if (action.action == 'end') 
        {
            this.hand.moving = false
            console.log('action end')
            return
        }
        let pos = Func.add(this.body.pos, Func.multiply(action.dir, 0.01)) //mult value is reach of the attack
        if (!this.hand.moving) 
            {
                // get radius from the item
                // extra options: bounce, mass
                let item = this.hand.item
                this.hand.body = new PhysicalBody({type: 'circle', pos: this.body.pos, rad: item.rad, mass: item.mass})
                this.hand.moving = true
            }
        // set target
        let target = Func.add(this.body.pos, Func.multiply(action.dir, 0.01))
        this.hand.body.target(target)
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
        this.input.dir = Func.multiply(input.joy, this.speedstat)
        for (let action of input.actions)
        {
            if (action.type == 'physical') this.handlePhysical(action)
            if (action.type == 'inventory') this.handleInventory(action)
            if (action.type == 'allocation') this.manageAttributes(action.attribute)
        }
    }
}