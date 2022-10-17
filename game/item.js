const PhysicalBody = require('./hitboxes.js')

class Item
{
    constructor(data)
    {
        this.type = data.type
        this.body = new PhysicalBody({type: 'circle', pos: data.pos, rad: data.rad})
        this.physical = data.physical
        this.moving = false
    }
    update(level, colliders)
    {
        this.handleActions() // HANDLE ACTIONS (SHOOTING, BUILDING ETC)

        this.handleCollisions(level, colliders) // HANDLE PHYSICAL COLLISIONS
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

    }
    data()
    {

    }
}

class Bow extends Item 
{
    constructor(data)
    {
        super(data)

    }
}

function createItem(type)
{

}

module.exports = 
{
 Item, Bow, createItem   
}