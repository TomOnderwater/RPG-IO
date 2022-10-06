const Func = require('./functions.js')

module.exports = class GroundItem{
    constructor(data)
    {
        this.id = data.id
        this.body = {}
        this.body.pos = data.pos
        this.speed = data.speed || Func.randomVector(0.1)
        this.body.rad = data.rad || 0.2 //pickup range
        this.item = data.item
    }
    update(entities)
    {
        this.body.pos = Func.add(this.body.pos, this.speed)
        this.speed = Func.multiply(this.speed, 0.5)
        for (let entity of entities)
        {
            if (Func.circleOnCircle(entity.body, this.body))
            {
                // check if it's elligble to pick it up
                if (entity.type == PLAYER) 
                {
                    entity.pickup(this.item)
                    return true
                }
            }
        }
        return false
    }
    data()
    {
        let pos = Func.fixPos(this.body.pos)
        return {
            i: this.id, 
            t: this.item.type, 
            p: pos}
    }
}