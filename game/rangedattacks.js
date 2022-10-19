const PhysicalBody = require('./hitboxes.js')
const Func = require('./functions.js')

module.exports = class RangedAttack
{
    constructor(data)
    {
        this.owner = data.owner
        this.dir = data.dir
        this.projectile = data.projectile
        this.item = data.item
        this.type = data.projectile.type
        this.owner = data.owner
        this.id = data.id
        this.body = new PhysicalBody({type: 'circle', pos: data.pos, rad: this.projectile.rad, bounce: 0.8})
        this.body.setSpeed(this.dir)
    }
    update(level, colliders)
    {
        let things = level.closeBodies(this.body.pos, colliders, 1)
        //console.log(things.length)
        let collisions = this.body.update(things, this.owner.body)
        
        for (let collision of collisions)
        {
            if (collision.entity.health !== undefined)
                            level.addEvent(Func.calcAttack({
                                collision, 
                                item: this.item, 
                                attacker: this.owner.id}))
            if (this.type === FIREBALL)
                level.addPhysicalEvent({
                    type: 'explosion',
                    pos: collision.pos,
                    owner: this.owner,
                    growth: 0.2,
                    maxticks: 3,
                }, level)                       
            return true
        }
        return false
    }
    data()
    {
        let pos = Func.fixPos(this.body.pos, 2)
        return {
            i: this.id, 
            t: this.type, 
            p: pos}
    }
}