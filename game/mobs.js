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

function randomWalk(maxspeed)
{
 return { x: Func.getRandom(-maxspeed, maxspeed), y: Func.getRandom(-maxspeed, maxspeed)}
}

class Slime
{
    constructor(pos, id, stats)
    {
        this.stats = stats || baseSlime()
        this.id = id
        this.body = new PhysicalBody({type: 'circle', mass: this.stats.mass, entity: this, pos, rad: this.stats.rad})
        this.perception = new Perception(this.stats.fov, this.stats.resolution, this.stats.range)
        this.maxspeed = 0.01
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
        let perception = this.perception.getSight(this, level, colliders)
        let action = this.getAction(perception.perception)
        //this.body.target(action.target)

        //get closest bodies to collide with
        //random movement event
        switch(action.action)
        {
            case 'move':
            this.dir = action.dir
            break
            default:
            if (Math.random() > 0.99) this.dir = randomWalk(this.maxspeed * 0.5)
            break
        }
        //if (Math.random() > 0.99) this.dir = randomWalk(this.maxspeed * 0.5)
        
        this.body.bounceSpeed(this.dir)
        let closest = []
        for (let body of perception.bodies)
        {
            if (body.dist > 1) break // they are sorted
            closest.push(body.body)
        }
        let collisions = this.body.update(closest)
    }
    getAction(perception)
    {
        for (let line of perception)
        {
            //console.log(line)
            if (line.ray.obj === 'player')
            {
                //console.log('player!!!')
                let fight = (this.health > this.maxhealth * 0.5)
                let angle = fight ? line.a : line.a + Math.PI
                let speed = fight ? this.maxspeed : this.maxspeed * 1.5
                let dir = Func.getVector(angle, speed)
                return {action: 'move', dir}
            }
        }
        return {action: 'wander'}
    }
    dead()
    {
        return this.health <= 0
    }
    applyDamage(damage, attacker)
    {
        this.health -= damage
        this.lastattacker = attacker.id
    }
    getXP()
    {
        return 10
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