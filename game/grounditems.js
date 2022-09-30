const Func = require('./functions.js')

module.exports = class GroundItem{
    constructor(data)
    {
        this.id = data.id
        this.body = {}
        this.body.pos = data.pos
        this.body.rad = data.rad || 0.2 //pickup range
        this.item = data.item
    }
    update(entities)
    {
        for (let entity of entities)
        {
            if (Func.circleOnCircle(entity.body, this.body))
            {
                // check if it's elligble to pick it up
                if (entity.type == 'player') 
                {
                    entity.pickup(this.item)
                    console.log('pickup!!!')
                    return true
                }
            }
        }
        return false
    }
    data()
    {
        let pos = Func.fixPos(this.body.pos)
        return {id: this.id, type: this.item.type, pos}
    }
}