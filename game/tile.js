const PhysicalBody = require('./hitboxes.js')

module.exports = class Tile
{
    constructor(x, y)
    {
        this.x = x
        this.y = y
        this.surface = DIRT
        this.structure = AIR
    }
    getStructure()
    {
        //if (this.structure === 'a') return
        return this.structure.body
    }
    addStructure(data)
    {
        this.structure = new Structure(data)
    }
    getData()
    {
        let t = (this.structure !== AIR) ? this.structure.id : this.structure
        return {x: this.x, y: this.y, s: this.surface, t}
    }
}

class Structure 
{
    constructor(data)
    {
        this.id = data.id
        this.body = new PhysicalBody(data)
    }
}