const PhysicalBody = require('./hitboxes.js')

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
        //if (this.structure === 'a') return
        return this.structure.body
    }
    addTree()
    {
        this.structure = new Structure({
            id: TREE, 
            health: 100, 
            type: 'circle',
            material: 'wood', 
            pos: {x: this.x + 0.5, y: this.y + 0.5}, rad: 0.2, 
            static: true})
    }
    addWall()
    {
        this.structure = new Structure({
            id: WALL, 
            type: 'rect',
            material: 'stone', 
            pos: {x: this.x, y: this.y}, 
            width: 1, 
            height: 1, 
            static: true})
    }
    addRock()
    {
        this.structure = new Structure({
            id: ROCK, 
            type: 'circle',
            material: 'stone', 
            pos: {x: this.x + 0.5, y: this.y + 0.5}, rad: 0.5, 
            static: true})
    }
    groundSpeed()
    {
        switch(this.surface)
        {
            case STONE:
                return 1
            case DIRT:
                return 0.8
            case GRASS:
                return 0.95
            case GRAVEL:
                return 0.7
            case SAND:
                return 0.6
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
        this.structure.id = AIR
    }
}

class Structure 
{
    constructor(data)
    {
        this.id = data.id
        this.material = data.material || 'wood'
        this.status = {}
        this.status.vitality = data.health || 100
        this.health = this.status.vitality
        data.entity = this
        this.structure = true
        this.body = new PhysicalBody(data)
    }
    applyDamage(damage)
    {
        //console.log('got hit!')
        if (this.id !== WALL) // if destructible
            this.health -= damage
        //console.log('structure health: ', this.health)
    }
}