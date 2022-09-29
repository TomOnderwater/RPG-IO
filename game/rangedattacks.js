const PhysicalBody = require('./hitboxes.js')
const Func = require('./functions.js')

module.exports = class RangedAttack
{
    constructor(data)
    {
        this.owner = data.owner
        this.attack = data.attack
        this.type = data.type
        this.dir = data.dir
        this.owner = data.owner
        this.id = data.id
        this.body = new PhysicalBody({type: 'circle', pos: data.pos, rad: data.rad, bounce: 0.8})
    }
    update(level, colliders)
    {
        this.body.bounceSpeed(this.dir)
        //console.log(this.body.pos)
        let things = level.closeBodies(this.body.pos, colliders, 1)
        //console.log(things.length)
        let collisions = this.body.update(things, this.owner.body)
        
        for (let collision of collisions)
        {
            //console.log(collision)
            let item = createItem('bow')
            if (collision.entity.health !== undefined)
                            level.addEvent(Func.calcAttack({
                                collision, 
                                item, 
                                attacker: this.owner.id}))
            return true
            //if (collision) return true
        }
        return false
    }
    data()
    {
        let pos = Func.fixPos(this.body.pos, 2)
        return {id: this.id, type: this.type, pos}
    }
}