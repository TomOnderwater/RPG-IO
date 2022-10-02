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
        this.type = 'player'
        this.body = new PhysicalBody({type: 'circle', entity: this, pos: data.pos, rad: 0.2})
        this.input = {dir: {x: 0, y: 0}, actions: []} //controller input
        this.inventory = new Inventory(6)
        this.session = data.session
        this.name = data.name
        this.hand = {id: 0, item: createItem('none'), body: new PhysicalBody({type: 'circle', pos: data.pos, rad: 0.15}), owner: this.id, moving: false}
        this.speedstat = 0.0005
        this.perceptionstat = 10
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
        console.log(item)
        this.inventory.add(item)
        //items.forEach(item => this.inventory.add(item))
        this.inventory.updated = true
    }

    update(level, colliders)
    {
        this.level = level
        // rotate sprite
        if (Func.magnitude(this.body.speed) > 0.01)
            this.heading = Math.atan2(this.body.speed.y, this.body.speed.x)

        this.body.bounceSpeed(this.input.dir)
        this.body.update(level.closeBodies(this.body.pos, colliders, 1))
        // if physical attack
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
    sees(pos)
    {
        return (pos.x >= this.body.pos.x - this.perceptionstat && pos.x <= this.body.pos.x + this.perceptionstat &&
        pos.y >= this.body.pos.y - this.perceptionstat && pos.y <= this.body.pos.y + this.perceptionstat)
    }
    data() 
        {
            let pos = Func.fixPos(this.body.pos, 2)
            return {id: this.id, 
                type: this.type, pos, name: this.name, health: this.health, maxhealth: this.status.vitality}
        }
    getHand()
    {
        return {id: this.hand.id, type: this.hand.item.type, pos: this.hand.body.pos, moving: this.hand.moving, owner: this.hand.owner}
    }
    handlePhysical(_input)
    {
        // beginning, or middle of the touch, init the item box
        let input = Func.constrainVector(_input, -128, 128)
        //if (Func.magnitude)
        if (Func.zeroVector(input)) 
        {
            if (this.hand.moving)
            {
                if (this.hand.item.type === 'bow')
                {
                    //shoot an arrow
                    let dir = Func.multiply(Func.subtract(this.body.pos, this.hand.body.pos), 2)
                    if (Func.magnitude(dir) > 0.1)
                        this.level.addRangedAttack(
                            {
                                owner: this, 
                                pos: this.body.pos, 
                                attack: this.hand.item.attack, 
                                dir, rad: 0.1, mass: 2,
                                type: 'arrow'})
                    }
            }
            this.hand.moving = false
            return
        }
        if (!this.hand.moving) 
            {
                let item = this.hand.item
                this.hand.body = new PhysicalBody({type: 'circle', pos: this.body.pos, rad: item.rad, mass: item.mass})
                this.hand.moving = true
            }
        // set target
        let target = Func.add(this.body.pos, Func.multiply(input, this.hand.item.reach))
        this.hand.body.target(target)
        if (!this.hand.item.physical) this.hand.body.update([])
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
        this.input.dir = Func.multiply(input.joy, this.speedstat)
        this.handlePhysical(input.hand)
        for (let action of input.actions)
        {
            if (action.type == 'inventory') this.handleInventory(action)
            if (action.type == 'allocation') this.manageAttributes(action.attribute)
        }
    }
}