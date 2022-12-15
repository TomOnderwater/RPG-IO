const PhysicalBody = require('../../util/hitboxes.js')
const Func = require('../../util/functions.js')
const calcAttack = require('../../util/damage.js')
const Perception = require('../../util/perception.js')

function randomWalk(maxspeed)
{
 return { x: Func.getRandom(-maxspeed, maxspeed), y: Func.getRandom(-maxspeed, maxspeed)}
}

const mass = 2
const rad = 0.3
const health = 150
const stamina = 100
const frequency = 5
const fov = Math.PI
const resolution = 11
const range = 7
const speed = 0.07

module.exports = class Charger
{
    constructor()
    {
        this.pos = {x: 0, y: 0}
        this.body = new PhysicalBody({type: 'circle', mass, entity: this, pos: this.pos, rad})
        this.perception = new Perception(fov, resolution, range)
        this.maxspeed = speed
        this.dir = {x: 0, y: 0}
        this.heading = 0
        this.stamina = stamina
        this.health = health
        this.maxhealth = health
        this.type = CHARGER
        this.name = Func.randomName() + ' the Critter'
        this.xp = 0
        this.enemies = [PLAYER]
        this.attack = 5
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
                if (action.dist < this.perception.range * 0.5) this.dir = this.sprint(action.dir)
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
        if (this.ticks === 0 || this.ticks % frequency === 0)
            this.updateActions(level, colliders)
        this.handleAction(this.action)
        //get closest bodies to collide with
        //random movement event
        
        //if (Math.random() > 0.99) this.dir = randomWalk(this.maxspeed * 0.5)
        let surfacespeed = level.getGroundSpeed(this.body.pos)
        // move the body
        this.body.bounceSpeed(Func.multiply(this.dir, surfacespeed))
        let closebodies = level.closeBodies(this.body.pos, colliders, 1)
        let collisions = this.body.update(closebodies)
        for (let collision of collisions)
        {
            if (Func.inList(collision.entity.type, this.enemies))
            {
                let damage = this.attack

                let attack = calcAttack({
                    collision, 
                    attacker: this.id, 
                    damage})

                level.addEvent(attack)
            }
        }
        // apply damage if player
        this.ticks ++
    }
    recover()
    {
        if (this.health < this.maxhealth) this.health += 1
        if (this.stamina < stamina) this.stamina += 1
    }
    getDrop()
    {
        let items = []
        //drop.item = createItem(this.)
        if (Math.random() > 0.4) 
        {
            let drop = {pos: Func.add(this.body.getCenter(), Func.randomVector(0.1))}
            drop.item = {type: AMMO}
            drop.item.count = Math.round(3 + Math.random() * 3)
            items.push(drop)
        }
        let xpdrop = {pos: Func.add(this.body.getCenter(), Func.randomVector(0.1))}
        xpdrop.item = {type: AMMO}
        xpdrop.item.count = 8
        items.push(xpdrop)
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