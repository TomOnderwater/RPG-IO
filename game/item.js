const PhysicalBody = require('./hitboxes.js')
const Func = require('./functions.js')
// an item has an id, a pos,
class Item
{
    constructor(data)
    {
        this.type = data.type
        this.bounce = 0.4
        this.mass = 0.1
        this.rad = 0.05
        this.resetBody()
        this.building = false
        this.reach = 0.01
        this.ammo = false
        this.moving = false
        this.primesignal = false
        this.primed = false
        this.events = []
        this.owner = false
    }
    update(hand, colliders)
    {
        if (hand.owner) this.owner = hand.owner
        // HANDLE ACTIONS (SHOOTING, BUILDING ETC)
        this.handleActions(hand)
        // PHYSICAL STUFF
        this.handleCollisions(colliders) // HANDLE PHYSICAL COLLISIONS
    }
    updatePriming()
    {
        let owner = this.owner
        let limsq = Math.pow(this.reach * 127, 2)
        let drawsq = Func.sqMag(Func.subtract(owner.body.pos, this.body.pos))
        if (drawsq > limsq && !this.primed)
        {
            this.primesignal = true
            this.primed = true
        } else if (drawsq < limsq) this.primed = false
    }
    addFeedBackEvent(event)
    {
        this.events.push(event)
    }
    getFeedBack()
    {
        if (this.events.length === 0 && !this.primesignal) return false
        let out = this.events
        if (this.primesignal) 
        {
            out.push({type: 'prime'})
            this.primesignal = false
        }
        this.events = []
        return out
    }
    resetBody(p)
    {
        let pos = p || {x: 0, y: 0}
        this.body = new PhysicalBody({type: 'circle', mass: this.mass, pos, rad: this.rad, bounce: this.bounce})
        this.handbounce = {x: 0, y: 0}
    }
    setPos(pos)
    {
        if (this.physical) this.body.pos = pos
        //if (this.pos !== undefined) this.pos = pos
    }
    handBounceTo(input)
    {
        let owner = this.owner
        let target = Func.multiply(input, this.reach)
        this.handbounce = Func.squareBounce(this.handbounce, target, this.bounce)
        this.body.pos = Func.add(owner.body.pos, this.handbounce) 
    }
    handleCollisions(colliders)
    {
        let level = this.owner.level
        if (this.moving && this.physical)
        {
            let closebodies = level.closeBodies(this.body.pos, colliders, 1)
            let collisions = this.body.update(closebodies, this.owner.body) // except owner body
            if (collisions)
            {
                if (collisions.length)
                {
                    for (let collision of collisions)
                    {
                        if (collision.entity.health !== undefined)
                            level.addEvent(Func.calcAttack({
                                collision, 
                                item: this, 
                                attacker: this.owner.id, 
                                power: 1}))
                    }
                }
            }
        }
    }
    handleActions(hand)
    {
        //this.hand = hand
        let owner = this.owner

        this.doAction(hand)
        // what to do when input turns to zero physical ends after this loop
    }
    data()
    {
    return { 
        t: this.type, 
        p: Func.fixPos(this.body.pos, 2),
        m: this.moving ? 1: 0, 
        o: this.owner.id}
    }
}

class Melee extends Item
{
    constructor(data)
    {
        super(data)
        this.physical = true
        this.attack = 5
        this.destruction = 3
        this.bounce = 0.4
        this.persistent = true
    }
    doAction(hand)
    {
        let owner = this.owner

        if (Func.zeroVector(hand.input)) 
        { 
            this.moving = false
            this.body.pos = owner.body.pos
            return
        }
        // spawn new body if transitioning to moving
        if (!this.moving)
        {
            this.resetBody(owner.body.pos)
            this.moving = true
        }
        let target = Func.add(owner.body.pos, Func.multiply(hand.input, this.reach))
        this.body.target(target)
    }
}

class Sword extends Melee
{
    constructor(data)
    {
        super(data)
        this.attack = 20
        this.mass = 0.3
        this.rad = 0.1
        this.resetBody()
    }
}

class Bow extends Item 
{
    constructor(data)
    {
        super(data)
        this.physical = false
        this.attack = 40
        this.minimumdraw = 0.4
        this.destruction = 2
        this.bounce = 0.2
        this.reach = 0.0025
        this.power = 2
        this.handbounce = {x: 0, y: 0}
        this.persistent = true
        this.projectile = {cost: 1, type: ARROW, rad: 0.1}
        this.ammo = true
    }
    shoot()
    {
        let owner = this.owner
        let inventory = owner.inventory
        let level = this.owner.level

        // check ammo before shooting:
        let _d = Func.subtract(Func.subtract(owner.body.pos, owner.body.speed), this.body.pos)

        let dir = Func.multiply(_d, this.power)
        // for debug purposes
        let projectile = this.projectile
        if (Func.magnitude(dir) > this.minimumdraw)
        {
            if (!inventory.canRemove({type: this.type, count: projectile.cost}))
                return // CAN'T AFFORD THE SHOT

            //get start pos
            let pos = owner.body.pos
            inventory.remove({type: this.type, count: projectile.cost})
            level.addRangedAttack({ owner, pos, dir, projectile, item: this })
            this.addFeedBackEvent({type: 'bowshot'})
        }
    }
    doAction(hand)
    {
        let owner = this.owner
        if (Func.zeroVector(hand.input)) 
        {
            if (this.moving)
                this.shoot()
            this.moving = false
            this.body.pos = owner.body.pos
            return
        }
        if (!this.moving) this.moving = true
        // move the body based on handbounce   
        this.handBounceTo(hand.input)

        this.updatePriming()
    }
}

class Staff extends Item
{
    constructor(data)
    {
        super(data)
        this.physical = false
        this.attack = 50
        this.minimumdraw = 0.25
        this.destruction = 2
        this.bounce = 0.3
        this.reach = 0.005
        this.power = 0.5
        this.persistent = true
        this.projectile = {type: FIREBALL, cost: 1, rad: 0.1}
        this.ammo = true
    }
    shoot()
    {
        let owner = this.owner
        let inventory = owner.inventory
        let level = this.owner.level

        // check ammo before shooting:
        let _d = Func.subtract(this.body.pos, Func.subtract(owner.body.pos, owner.body.speed))

        let dir = Func.multiply(_d, this.power)

        // for debug purposes
        let projectile = this.projectile
        if (Func.magnitude(dir) > this.minimumdraw)
        {
            if (!inventory.canRemove({type: this.type, count: projectile.cost}))
                return // CAN'T AFFORD THE SHOT

            //get start pos
            let pos = this.body.pos
            inventory.remove({type: this.type, count: projectile.cost})
            level.addRangedAttack({ owner, pos, dir, projectile, item: this })
            this.addFeedBackEvent({type: 'bowshot'})
        }
    }
    doAction(hand)
    {
        let owner = this.owner
        if (Func.zeroVector(hand.input)) 
        {
            if (this.moving)
                this.shoot()
            this.moving = false
            this.body.pos = owner.body.pos
            return
        }
        if (!this.moving) this.moving = true
        // move the body based on handbounce   
        this.handBounceTo(hand.input)

        this.updatePriming()
    }
}

class BuildItem extends Item
{
    constructor(data)
    {
        super(data)
        this.building = true
        this.physical = false,
        this.persistent = false
    }
    doAction(hand)
    {
        let owner = this.owner
        if (Func.zeroVector(hand.input)) 
        {
            this.moving = false
            this.body.pos = owner.body.pos
            return
        }
        this.moving = true
        let level = owner.level

        this.handBounceTo(hand.input)
        level.build(this) // will try to build
    }
}

module.exports = function createItem(type)
{
    switch(type)
    {
        case NONE:
            return new Melee({type})
        case SWORD:
            return new Sword({type})
        case BOW:
            return new Bow({type})
        case STAFF:
            return new Staff({type})
        default:
            return new BuildItem({type})
    }
}