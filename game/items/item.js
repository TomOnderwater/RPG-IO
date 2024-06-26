const PhysicalBody = require('../util/hitboxes.js')
const Func = require('../util/functions.js')
const Chain = require('../util/chain.js')
const calcAttack = require('../util/damage.js')
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
        this.owner = false
        this.primelimit = 127.7
    }
    update(hand, colliders)
    {
        if (hand.owner) this.owner = hand.owner
        // HANDLE ACTIONS (SHOOTING, BUILDING ETC)
        this.handleActions(hand)
        // PHYSICAL STUFF
        if (this.owner.invulnerableticks > 0) // check for invulnerabilty
            this.handleCollisions(colliders, false) // HANDLE PHYSICAL COLLISIONS
        else this.handleCollisions(colliders)
    }
    updatePriming()
    {
        let owner = this.owner
        let limsq = Math.pow(this.reach * this.primelimit, 2)
        let drawsq = Func.sqMag(Func.subtract(owner.body.pos, this.body.pos))
        if (drawsq > limsq && !this.primed)
        {
            this.primesignal = true
            this.primed = true
        } else if (drawsq < limsq) this.primed = false
    }
    addFeedBackEvent(event)
    { // physical stuff, audible
        event.pos = this.body.pos
        event.owner = this.owner.id
        this.owner.level.addEvent(event)
    }
    getFeedBack()
    {
        if (!this.primesignal) return false
        let out = []
        if (this.primesignal) 
        {
            out.push({type: 'prime'})
            this.primesignal = false
        }
        return out
    }
    resetBody(p)
    {
        let pos = p || {x: 0, y: 0}
        this.body = new PhysicalBody({type: 'circle', 
        mass: this.mass, 
        pos, rad: this.rad, 
        bounce: this.bounce,
        drag: this.drag || 1})
        this.handbounce = {x: 0, y: 0}
    }
    fireProjectile(projectile, dir, inventory, level)
    {
    //if (!this.projectile || !this.owner) return
    if (Func.magnitude(dir) > this.minimumdraw)
    {
        if (!inventory.hasAmmo(projectile.cost))
            {
                projectile.cost = this.projectile.cost // CAN'T AFFORD THE SHOT
                if (!inventory.hasAmmo(projectile.cost)) // try lower
                return
            }

        //get start pos
        let pos = this.body.pos
        inventory.removeAmmo(projectile.cost)
        //inventory.remove({type: this.type, count: projectile.cost})
        level.addRangedAttack({ owner: this.owner, pos, dir, projectile, item: this })
        this.addFeedBackEvent({type: projectile.type})
        }
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
    handleCollisions(colliders, attackEnabled = true)
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
                        if (collision.entity.health !== undefined && attackEnabled)
                            level.addEvent(calcAttack({
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
        o: this.owner.id,
        P: this.primed ? 1 : 0}
    }
}

class Flail extends Item
{
    constructor(data)
    {
        super(data)
        this.physical = true
        this.attack = 65
        this.mass = 2.5
        this.reach = 0.006 // reach of the handle
        this.destruction = 10
        this.bounce = 0.2
        this.rad = 0.15
        this.persistent = true
        this.resetBody()
        this.resetChain()
    }
    resetChain()
    {
        this.chain = new Chain(this.body.pos, 3, 0.2, this.mass)
    }
    doAction(hand)
    {
        let owner = this.owner

        if (Func.zeroVector(hand.input)) 
        { 
            // initiate release
            this.moving = false
            this.body.pos = owner.body.pos
            return
        }
        // spawn new body if transitioning to moving
        if (!this.moving)
        {
            this.resetBody(owner.body.pos)
            this.resetChain()
            this.moving = true
        }

        let handtarget = Func.multiply(hand.input, this.reach)
        this.handbounce = Func.squareBounce(this.handbounce, handtarget, this.bounce)

        this.chain.move(Func.add(owner.body.pos, this.handbounce))
        this.chain.update()
        let target = this.chain.getEnd().pos
        let speed = Func.subtract(target, this.body.pos)
        //this.body.pos = target
        this.body.setSpeed(speed)
        //console.log(speed)
    }
    handleCollisions(colliders, attackEnabled = true)
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
                        if (collision.entity.health !== undefined && attackEnabled)
                            level.addEvent(calcAttack({
                                collision, 
                                item: this, 
                                attacker: this.owner.id, 
                                power: 1}))
                    }
                }
            }
            this.chain.getEnd().pos = this.body.pos
        }
    }
    data()
    {
    return { 
        t: this.type, 
        p: Func.fixPos(this.body.pos, 2),
        m: this.moving ? 1: 0, 
        o: this.owner.id,
        links: this.chain.getPoints()}
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
        this.attack = 30
        this.minimumdraw = 0.5
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

        // copy for anti-bug purposes
        let projectile = Func.cloneObject(this.projectile)

        if (this.primed)
            projectile.cost *= 2

        // boost power if possible
        if (inventory.canRemove({type: this.type, count: projectile.cost}))
            dir = Func.multiply(dir, 1 + (projectile.cost * 0.3))

        this.fireProjectile(projectile, dir, inventory, level)
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
        let projectile = {type: this.projectile.type, 
            cost: this.projectile.cost, 
            rad: this.projectile.rad}

        if (this.primed)
            projectile.cost *= 8

        this.fireProjectile(projectile, dir, inventory, level)

    }
    doAction(hand)
    {
        let owner = this.owner
        if (Func.zeroVector(hand.input)) 
        {
            // check for invulnerabilty
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
        case FLAIL:
            return new Flail({type})
        default:
            return new BuildItem({type})
    }
}
