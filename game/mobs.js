const PhysicalBody = require('./hitboxes.js')
const Func = require('./functions.js')
const Perception = require('./perception.js')

function baseSlime()
{
    let stats = {}
    stats.rad = 0.2 //body diameter
    stats.health = 50
    stats.type = SLIME
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
        this.sight = false
        this.dir = {x: 0, y: 0}
        this.heading = 0
        this.stamina = this.stats.stamina
        this.health = this.stats.health
        this.maxhealth = this.stats.health
        this.type = SLIME
        this.name = Func.randomName() + ' the Critter'
        this.xp = 0
        this.enemies = [PLAYER]
        this.attack = this.stats.attack
        this.ticks = 0
    }
    updateActions(level, colliders)
    {
        let perception = this.perception.getSight(this, level, colliders)
        this.action = this.getAction(perception.perception)
    }
    handleAction(action)
    {
        switch(action.action)
        {
            case 'attack':
                if (action.dist < 1) this.dir = this.sprint(action.dir)
                else this.dir = Func.multiply(action.dir, this.maxspeed)
            break
            case 'flee':
                this.dir = this.sprint(action.dir)
                break
            case 'wander':
                this.dir = action.dir
                break
            default:

                break
        }
    }
    update(level, colliders)
    {
        if (this.ticks === 0 || this.ticks % 10 === 0)
            this.updateActions(level, colliders)
        this.handleAction(this.action)
        //get closest bodies to collide with
        //random movement event
        
        //if (Math.random() > 0.99) this.dir = randomWalk(this.maxspeed * 0.5)
        
        this.body.bounceSpeed(this.dir)
        let closebodies = level.closeBodies(this.body.pos, colliders, 1)
        let collisions = this.body.update(closebodies)
        for (let collision of collisions)
        {
            //console.log(collision.entity)
            if (collision.entity.type == PLAYER)
            {
                let damage = this.stats.attack
                collision.entity.applyDamage(this.attack, this.id)
                level.addEvent({type: 'damage', dir: collision.speed, pos: collision.pos, damage, item: SLIME})
            }
        }
        // apply damage if player
        this.ticks ++
    }
    recover()
    {
        if (this.health < this.maxhealth) this.health += 1
        if (this.stamina < this.stats.stamina) this.stamina += 1
    }
    getDrop()
    {
        let items = []
        //drop.item = createItem(this.)
        if (Math.random() > 0.4) 
        {
            let drop = {pos: this.body.getCenter()}
            drop.item = {type: AMMO}
            drop.item.count = Math.round(3 + Math.random() * 3)
            items.push(drop)
        }
        return items
    }
    isEnemy(other)
    {
        for (let enemy of this.enemies)
        {
            if (other === enemy) return true
        }
        return false
    }
    getAction(perception)
    {
        for (let line of perception)
        {
            if (this.isEnemy(line.ray.obj))
            {
                //console.log('player!!!')
                let fight = (this.health > this.maxhealth * 0.3)
                if (fight)
                    {
                        let angle = line.a
                        return {
                            action: 'attack',
                            dir: Func.getVector(angle, 1), 
                            dist: line.ray.dist}
                    } else
                    {
                        let angle = line.a + Math.PI
                        return {
                        action: 'flee',
                        dir: Func.getVector(angle, 1)
                        }
                    }
            }
        }
        if (Math.random() > 0.95)
            return {action: 'wander',
                    dir: randomWalk(this.maxspeed * 0.5)}
        return { action: 'continue'}
    }
    sprint(dir)
    {
        if (this.stamina > 0) 
        {
            this.stamina -= 1
            return Func.multiply(dir, this.maxspeed * 2)
        }
        return Func.multiply(dir, this.maxspeed)
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
            return {
                i: this.id, 
                t: this.type, 
                p: pos, 
                h: this.health, 
                H: this.maxhealth
            }
        }
}

module.exports =
{
    Slime
}