const PhysicalBody = require('./hitboxes.js')
const Func = require('./functions.js')
const Perception = require('./perception.js')

function baseSlime()
{
    let stats = {}
    stats.rad = 0.2 //body diameter
    stats.health = 50
    stats.type = 'slime'
    stats.fov = 2 * Math.PI
    stats.resolution = 10
    stats.range = 3
    stats.mass = 0.5
    return stats
}

class Slime
{
    constructor(pos, id, stats)
    {
        this.stats = stats || baseSlime()
        this.id = id
        this.body = new PhysicalBody({type: 'circle', mass: this.stats.mass, entity: this, pos, rad: this.stats.rad})
        this.perception = new Perception(this.stats.fov, this.stats.resolution, this.stats.range)
        this.maxspeed = 0.005
        this.dir = {x: 0, y: 0}
        this.heading = 0
        this.health = this.stats.health
        this.maxhealth = this.stats.health
        this.type = 'slime'
    }
    getAction(level, colliders)
    {
        return {target: {x: this.body.pos.x, y: this.body.pos.y}}
    }
    update(level, colliders)
    {
        //let perception = this.perceive(level)
        //let action = this.getAction(perception)
        //this.body.target(action.target)

        //random movement
        if (Math.random() > 0.99) 
            this.dir = {
                    x: Func.getRandom(-this.maxspeed, this.maxspeed), 
                    y: Func.getRandom(-this.maxspeed, this.maxspeed)
                }
            this.body.bounceSpeed(this.dir)
        let collisions = this.body.update(level.closeBodies(this.body.pos, colliders, 1))
    }
    applyDamage(damage)
    {
        this.health -= damage
    }
    data() 
        {
            let x = Func.fixNumber(this.body.pos.x, 2)
            let y = Func.fixNumber(this.body.pos.y, 2)
            let pos = {x,y}
            return {id: this.id, type: this.type, pos, health: this.health, maxhealth: this.maxhealth}
        }
}

module.exports =
{
    Slime
}