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
    stats.stamina = 100
    stats.attack = 1
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
        this.stamina = this.stats.stamina
        this.health = this.stats.health
        this.maxhealth = this.stats.health
        this.type = 'slime'
        this.name = 'slime'
        this.xp = 0
        this.attack = this.stats.attack
    }
    getAction(level, colliders)
    {
        return {target: {x: this.body.pos.x, y: this.body.pos.y}}
    }
    update(level, colliders)
    {
        let perception = this.perception.getSight(this, level, colliders)
        let action = this.getAction(perception.perception)

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
        for (let collision of collisions)
        {
            //console.log(collision.entity)
            if (collision.entity.type == 'player')
            {
                let damage = this.stats.attack
                collision.entity.applyDamage(this.attack, this.id)
                level.addEvent({type: 'damage', dir: collision.speed, pos: collision.pos, damage, item: 'slime'})
            }
        }
        // apply damage if player

    }
    recover()
    {
        if (this.health < this.maxhealth) this.health += 1
        if (this.stamina < this.stats.stamina) this.stamina += 1
    }
    getAction(perception)
    {
        for (let line of perception)
        {
            //console.log(line)
            if (line.ray.obj === 'player')
            {
                //console.log('player!!!')
                let fight = (this.health > this.maxhealth * 0.3)
                let angle = fight ? line.a : line.a + Math.PI
                let speed = fight ? this.maxspeed : this.maxspeed + this.sprint()
                //burst speed on low distance
                if (fight && line.ray.dist < 1) speed += this.sprint()
                //speed += line.ray.dist 
                let dir = Func.getVector(angle, speed)
                return {action: 'move', dir}
            }
        }
        return {action: 'wander'}
    }
    sprint()
    {
        if (this.stamina > 0) 
        {
            this.stamina -= 1
            return this.maxspeed
        }
        return 0
    }
    dead()
    {
        return this.health <= 0
    }
    applyDamage(damage, attacker)
    {
        this.health -= damage
        this.lastattacker = attacker
    }
    addXP(xp)
    {
        this.xp += xp
        this.maxhealth = this.stats.health + Math.round((this.xp * 0.1))
        this.attack = this.stats.attack + (Math.round(this.xp * 0.01))
    }
    getXP()
    {
        return Math.round((this.xp * 0.5) + 10)
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