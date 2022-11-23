const PhysicalBody = require('../util/hitboxes.js')
const Func = require('../util/functions.js')
const createItem = require('../items/item.js')
const createStructure = require('./structures/structure.js')

module.exports = class Tile
{
    constructor(x, y)
    {
        this.x = x
        this.y = y
        this.surface = DIRT
        this.structure = {id: AIR}
    }
    getStructure()
    {
        return this.structure.body
    }
    addStructure(type)
    {
        this.structure = createStructure(this, type)
    }
    groundSpeed()
    {
        switch(this.surface)
        {
            case STONE:
                return 1
            case DIRT:
                return 0.85
            case GRASS:
                return 0.95
            case GRAVEL:
                return 0.9
            case SAND:
                return 0.7
            case WATER:
                return 0.3
            default:
                return 1
        }
    }
    getData()
    {
        return {x: this.x, y: this.y, s: this.surface, t: this.structure.id}
    }
    destroyStructure()
    {
        let items = this.structure.getItems()
        this.structure.id = AIR
        this.structure.health = 100 // dirty fix
        return items
    }
}