const Func = require('./functions.js')
const PhysicalBody = require('./hitboxes.js')

module.exports = class PhysicalEvent
{
    constructor(data, level)
    {
        this.ticks = 0
        this.level = level
        this.owner = data.owner
        switch(data.type)
        {
            case 'explosion':
                let rad = data.rad || 0.5
                //console.log('explosion rad:', rad)
                level.addEvent({
                    type: 'explosion', pos: data.pos
                })
                this.maxticks = 3
                this.event = new Explosion(this, data.pos, rad)
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
        this.growth = 0.2
        this.body = new PhysicalBody({type: 'circle', rad, pos})
        this.event = event
        this.damage = 5
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
            let mag = Func.constrain(this.growth / Func.sqDist(this.body.pos, collision), 0, 0.5)
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
                    target: {color: {r:255, g: 0, b: 0}}
                })
            }

        }
    }
}