const PhysicalBody = require('./hitboxes.js')
const Func = require('./functions.js')
const createItem = require('./item.js')

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
            health: 25, 
            type: 'circle',
            material: WOOD, 
            pos: {x: this.x + 0.5, y: this.y + 0.5}, rad: 0.2, 
            static: true})
    }
    addWall()
    {
        this.structure = new Structure({
            id: WALL, 
            type: 'rect',
            material: ROCK, 
            pos: {x: this.x, y: this.y}, 
            width: 1, 
            height: 1, 
            static: true})
    }
    addStoneWall()
    {
        this.structure = new Structure({
            id: STONEWALL, 
            type: 'rect',
            material: ROCK, 
            pos: {x: this.x, y: this.y}, 
            width: 1, 
            height: 1,
            health: 100,
            droprate: 0, 
            static: true})
    }
    addWoodWall()
    {
        this.structure = new Structure({
            id: WOODWALL, 
            type: 'rect',
            material: WOOD, 
            pos: {x: this.x, y: this.y}, 
            width: 1, 
            height: 1, 
            health: 40,
            droprate: 0,
            static: true})
    }
    addRock()
    {
        this.structure = new Structure({
            id: ROCK, 
            type: 'circle',
            material: ROCK, 
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
                return 0.85
            case GRASS:
                return 0.95
            case GRAVEL:
                return 0.8
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
        if (data.droprate === undefined)
            this.droprate = 1 + Math.round(Math.random() * 2)
        else this.droprate = data.droprate
    }
    applyDamage(damage)
    {
        //console.log('got hit!')
        if (this.id !== WALL) // if destructible
            this.health -= damage
        //console.log('structure health: ', this.health)
    }
    getItems()
    {
        let items = []
        let drop = {pos: this.body.getCenter()}
        drop.item = createItem(this.material)
        //console.log(this.droprate)
        drop.item.count = this.droprate
        if (drop.item.count)
            items.push(drop)
        //console.log('drop:', items)
        return items
    }
}