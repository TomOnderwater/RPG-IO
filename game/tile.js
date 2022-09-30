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

    }
    getData()
    {
        let t = (this.structure !== AIR) ? this.structure.id : this.structure
        return {x: this.x, y: this.y, s: this.surface, t}
    }
    destroyStructure()
    {
        this.structure = AIR
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
        console.log('structure health: ', this.health)
    }
}