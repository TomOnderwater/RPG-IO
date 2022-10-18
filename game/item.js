const PhysicalBody = require('./hitboxes.js')

// an item has an id, a pos,
class Item
{
    constructor(data)
    {
        this.type = data.type
        this.resetBody()
        this.building = false
        this.reach = 0.01
        this.ammo = false
        this.mass = 0.1
        this.rad = 0.05
    }
    update(level, colliders)
    {
        // HANDLE ACTIONS (SHOOTING, BUILDING ETC)
        this.handleActions()
        // PHYSICAL STUFF (if body is defined)
        this.handleCollisions(level, colliders) // HANDLE PHYSICAL COLLISIONS
    }
    resetBody(p)
    {
        let pos = p || {x: 0, y: 0}
        this.body = new PhysicalBody({mass: this.mass, pos, rad: this.rad})
    }
    setPos(pos)
    {
        if (this.physical) this.body.pos = pos
        //if (this.pos !== undefined) this.pos = pos
    }
    bounceTo(pos)
    {
        
    }
    handleCollisions(level, colliders)
    {
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
                                item: this.item, 
                                attacker: this.owner.id, 
                                power: 1 + (this.owner.status.strength * 0.2)}))
                    }
                }
            }
        }
    }
    handleActions()
    {
        // code from hand runs here


    }
    data()
    {

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
    handleActions()
    {
        //console.log('i am a fist that is updating')
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
        this.minimumdraw = 0.15
        this.destruction = 2
        this.bounce = 0.4
        this.reach = 0.0025
        this.persistent = true
        this.projectile = ARROW
        this.ammo = true
    }
}

class Staff extends Item
{
    constructor(data)
    {
        super(data)
        this.physical = false
        this.attack = 50
        this.minimumdraw = 0.15
        this.destruction = 2
        this.bounce = 0.4
        this.reach = 0.005
        this.persistent = true
        this.projectile = FIREBALL
        this.ammo = true
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