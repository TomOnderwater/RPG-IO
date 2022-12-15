const Func = require('../util/functions.js')
const PhysicalBody = require('../util/hitboxes.js')

module.exports = class PhysicalEvent
{
    constructor(data, level)
    {
        this.ticks = 0
        this.level = level
        this.owner = data.owner
        this.maxticks = data.maxticks || 2
        this.cost = data.cost || 1
        this.dir = data.dir || {x: 0, y: 0}
        switch(data.type)
        {
            case 'explosion':
                let rad = data.rad || 0.5
                //console.log('explosion rad:', rad)
                level.addEvent({
                    type: 'explosion', pos: data.pos, cost: this.cost, dir: this.dir, owner: this.owner.id
                })
                this.event = new Explosion(this, data.pos, rad)
                if (data.growth !== undefined) this.event.growth = data.growth
            break
        }
    }
    update(level, colliders)
    {
        this.event.update(level, colliders)
        this.ticks ++
        return this.ended()
    }
    ended()
    {
        return this.ticks > this.maxticks
    }
}

class Explosion
{
    constructor(event, pos, rad)
    {
        this.growth = 0.2 * this.cost
        this.body = new PhysicalBody({type: 'circle', rad, pos})
        this.event = event
        this.damage = Math.round(10 * event.cost)
        //console.log(this.body)
    }
    update(level, colliders)
    {
        let closebodies = level.closeBodies(this.body.pos, colliders, this.body.rad + 1)
        for (let i = 0; i < closebodies.length; i++)
        {
            let collision = this.body.collide(closebodies[i])
            //console.log(collision)
            if (collision)
                this.impact(closebodies[i], collision)
        }
        this.body.rad += this.growth
    }
    impact(body, collision)
    {
        //let dir = Func.subtract(this.pos, body.center())
        // check if it has health
        //console.log(body)
        if (!body.static)
        {
            let mag = Func.constrain(this.growth / (Func.sqDist(this.body.pos, collision) + 0.0001), 0, 0.5)
            let normal = Func.normalize(Func.subtract(collision, this.body.pos))
            let dir = Func.multiply(normal, mag)
            //console.log(dir)
            body.applyForce(dir)

             // damage stuff
            if (body.entity.health !== undefined)
            {
                body.entity.applyDamage(this.damage, this.event.owner.id)
                this.event.level.addEvent({
                    type: 'damage', 
                    dir, pos: collision, 
                    damage: this.damage,
                    target: {type: 'stone'},
                    owner: this.event.owner.id
                })
            }
        }
        else
        {
            if (body.entity.health !== undefined)
            {
                body.entity.applyDamage(this.damage)
                this.event.level.addEvent({
                    type: 'damage', 
                    dir: {x: 0, y: 0}, 
                    pos: collision, 
                    damage: this.damage,
                    target: {type: 'blood', id: body.entity.id},
                    owner: this.event.owner.id
                })
            }
        }
    }
}