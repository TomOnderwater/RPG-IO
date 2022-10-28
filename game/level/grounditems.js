const Func = require('../util/functions.js')

module.exports = class GroundItem{
    constructor(data)
    {
        this.id = data.id
        this.body = {}
        this.body.pos = data.pos
        this.body.rad = data.item.rad || 0.2 //pickup range
        this.item = data.item
    }
    update(entities)
    {
        for (let entity of entities)
        {
            if (Func.circleOnCircle(entity.body, this.body))
            {
                // check if it's elligble to pick it up
                if (entity.type == PLAYER) 
                    return entity.pickup(this.item)
                    //return true
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
            p: pos,
            g: 1}
    }
}