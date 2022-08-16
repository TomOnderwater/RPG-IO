const PhysicalBody = require('./hitboxes.js')
const Func = require('./functions.js')
const Perception = require('./perception.js')

function getSlime()
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


class Mob
{
    constructor(pos, stats)
    {
        this.stats = stats || getSlime()
        this.body = new PhysicalBody({type: 'circle', mass: this.stats.mass, entity: this, pos, rad: this.stats.rad})
        this.perception = new Perception(this.stats.fov, this.stats.resolution, this.stats.range)
        this.heading = 0
        this.health = this.stats.health
        this.maxhealth = this.stats.health
        this.vision
        this.type = stats.type
    }
    perceive(level)
    {
       return this.perception.getSight(this, level)
    }
}

class Other
{
    constructor(pos, type)
    {
        this.pos = pos
        this.type = type
        this.ticks = 0
    }
    update(perception)
    {
        
    }
}

class Slime
{
    constructor(pos)
    {
        let stats = getSlime()
        super(pos, stats)
    }
    getAction(level, colliders)
    {
        return {target: {x: this.body.pos.x, y: this.body.pos.y}}
    }
    update(level, colliders)
    {
        let perception = this.perceive(level)
        let action = this.getAction(perception)
        this.body.target(action.target)
    }
}