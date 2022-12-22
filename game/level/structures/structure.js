const PhysicalBody = require('../../util/hitboxes.js')
const createItem = require('../../items/item.js')
const Func = require('../../util/functions.js')

module.exports = function createStructure(tile, type)
{
    switch(type)
    {
        case TREE:
            return new Tree(tile)
        case WALL:
            return new Wall(tile)
        case STONEWALL:
            return new StoneWall(tile)
        case WOODWALL:
            return new WoodWall(tile)
        case TREASURECHEST:
            return new TreasureChest(tile)
        case ROCK:
            return new Rock(tile)
        default:
            return new Tree(tile)
    }
}

class Tree
{
    constructor(tile)
    {
        this.id = TREE
        this.health = 25
        this.structure = true
        this.body = new PhysicalBody(
            {
                type: 'circle',
                pos: {x: tile.x + 0.5, y: tile.y + 0.5},
                rad: 0.2,
                static: true,
                entity: this
            }
        )
        this.droprate = 2
    }
    applyDamage(damage)
    {
        this.health -= damage
    }
    getItems()
    {
        let items = []
        let drop = {pos: this.body.getCenter()}
        drop.item = createItem(WOOD)
        drop.item.count = this.droprate
        if (drop.item.count)
            items.push(drop)
        return items
    }
}

class Rock
{
    constructor(tile)
    {
        this.id = ROCK
        this.health = 100
        this.structure = true
        this.body = new PhysicalBody(
            {
                type: 'circle',
                pos: {x: tile.x + 0.5, y: tile.y + 0.5},
                rad: 0.5,
                static: true,
                entity: this
            }
        )
        this.droprate = 2
    }
    applyDamage(damage)
    {
        this.health -= damage
    }
    getItems()
    {
        let items = []
        let drop = {pos: this.body.getCenter()}
        drop.item = createItem(ROCK)
        drop.item.count = this.droprate
        if (drop.item.count)
            items.push(drop)
        return items
    }
}

class TreasureChest
{
    constructor(tile)
    {
        this.id = TREASURECHEST
        this.health = 5
        this.structure = true
        this.body = new PhysicalBody(
            {
                type: 'circle',
                pos: {x: tile.x + 0.5, y: tile.y + 0.5},
                rad: 0.4,
                static: true,
                entity: this
            }
        )
        this.options = [SWORD, STAFF, BOW, FLAIL]
    }
    applyDamage(damage)
    {
        this.health -= damage
    }
    getItems()
    {
        let items = []
        let option = Func.chooseOne(this.options)
        let drop = {pos: this.body.getCenter()}
        drop.item = createItem(option)
        drop.item.count = 0
        //console.log('drop:', items)
        items.push(drop)
        return items
    }
}

class Wall
{
    constructor(tile)
    {
        this.id = WALL
        this.health = 100
        this.structure = true
        this.body = new PhysicalBody(
            {
                type: 'rect',
                pos: {x: tile.x, y: tile.y},
                width: 1, height: 1,
                static: true,
                entity: this
            }
        )
        this.droprate = 0
    }
    applyDamage(damage)
    {
        //this.health -= damage
    }
    getItems()
    {
        return []
    }
}

class WoodWall
{
    constructor(tile)
    {
        this.id = WOODWALL
        this.health = 40
        this.structure = true
        this.body = new PhysicalBody(
            {
                type: 'rect',
                pos: {x: tile.x, y: tile.y},
                width: 1, height: 1,
                static: true,
                entity: this
            }
        )
        this.droprate = 0
    }
    applyDamage(damage)
    {
        this.health -= damage
    }
    getItems()
    {
        return []
    }
}

class StoneWall
{
    constructor(tile)
    {
        this.id = STONEWALL
        this.health = 100
        this.structure = true
        this.body = new PhysicalBody(
            {
                type: 'rect',
                pos: {x: tile.x, y: tile.y},
                width: 1, height: 1,
                static: true,
                entity: this
            }
        )
        this.droprate = 0
    }
    applyDamage(damage)
    {
        this.health -= damage
    }
    getItems()
    {
        return []
    }
}
