const Tile = require('./tile.js')
const LevelGenerator = require('./levelgeneration.js')
const Func = require('./functions.js')

module.exports = class Level 
{
    constructor(level, dungeon)
    {
        this.size = level.size
        this.dungeon = dungeon
        this.tiles = new LevelGenerator(level).getTiles()
        this.players = []
        this.entities = [] // list of items in motion with a rotation, collisionstyle: box
        this.items = []
        this.ticks = 0
        this.events = []
    }
    getSpawnPos(body)
    {
        //return {x: this.size / 2, y: this.size / 8}
        return this.getFreeSpot({x: this.size / 2, y: this.size / 8}, body)
    }
    takePlayer(id)
    {
        let player = this.getPlayer(id)
        if (!player) return // some error handling
        let clone = JSON.parse(JSON.stringify(player)) // clone player
        this.removePlayer(id)
        return clone
    }
    removePlayer(id)
    {
        for (let i = this.players.length - 1; i >= 0; i--)
        {
            if (player.id === id) 
            {
                this.players.splice(i, 1)
                break
            }
        }
    }
    addPlayer(player, initpos)
    {
    // where do we move the player?
    player.body.pos = initpos || this.getSpawnPos(player.body)
    this.players.push(player)
    }
    getPlayer(id)
    {
        for (let player of this.players)
        {
            if (id === player.id) return player
        }
        return null
    }
    getPlayerBySession(session)
    {
        for (let player of this.players)
        {
            if (session === player.session) return player
        }
        return null
    }
    update()
    {
        let entities = [...this.players, ...this.entities] //collect everything
        entities.forEach(entity => entity.update(this, entities))
        for (let i = this.players.length - 1; i >= 0; i--)
        {
            let player = this.players[i]
            if (player.dead()) 
            {
                this.dungeon.addScore(player.getScore(), player.id)
                this.players.splice(i, 1)
            }
        }
    }
    getEvents(player)
    {
        let events = []
        let sqrange = player.perceptionstat * player.perceptionstat
        this.events.forEach(event =>
        {
            if (Func.sqDist(player.body.pos, event.pos) < sqrange)
            {
                // get relevant events
                events.push({pos: event.pos, damage: event.damage})
            }
        })
        //console.log('output events:', events)
        return events
    }
    resetEvents()
    {
        this.events = []
    }
    addEvent(event)
    {
        console.log('new event:', event)
        this.events.push(event)
    }
    closeBodies(pos, colliders, range)
    {
        //let colliders = [...this.players, ...this.entities]
        let close = this.getStructures(pos, range)
        for (let collider of colliders)
        {
            if (Func.inRange(pos, collider.body.pos, range)) close.push(collider.body) 
        }
        //console.log('bodies in range:', close.length)
        return close
    }
    getFreeSpot(testpos, body)
    {
        // first round, test original
        let colliders = [...this.players, ...this.entities]
        let close = this.closeBodies(testpos, colliders, 5)
        let maxdist = 2
        let original = {x: testpos.x, y: testpos.y}
        while(true) 
        {
            let resolved = true
            for (let collider of close)
            {
                // check if distance is greater than reasonable
                if (Func.dist(testpos, collider.pos) > 2) continue
                // check the body is the same as the testbody
                if (collider == body) continue

                if (body.virtualCollision(testpos, collider))
                {
                    // collision! get a new random pos
                    testpos = {x: original.x + (Math.random() - 0.5) * maxdist, y: original.y + (Math.random() - 0.5) * maxdist}
                    maxdist += 0.5
                    resolved = false
                    break
                }
            }
            if (resolved) break
        }
        return testpos
    }
    getCloseBodiesFromPos(pos)
    {

    }
    getEntities(player)
    {
        let entities = [] //everything else
        for (let other of this.players)
        {
            entities.push(other.data())
            entities.push(other.getHand())
        }
        return entities
    }
    getStructures(pos, range)
    {
        let tiles = this.getTiles(pos, range)
        let structures = []
        for (let tile of tiles)
        {
            if (tile.structure !== AIR) structures.push(tile.getStructure())
        }
        return structures
    }
    getTiles(pos, range)
    {
        let x1 = Math.round(pos.x) - range
        if (x1 < 0) x1 = 0
        let y1 = Math.round(pos.y) - range
        if (y1 < 0) y1 = 0

        let x2 = Math.round(pos.x) + range
        if (x2 > this.size - 1) x2 = this.size - 1
        let y2 = Math.round(pos.y) + range
        if (y2 > this.size - 1) y2 = this.size - 1

        let tiles = []
        for (let x = x1; x < x2; x++)
        {
            for (let y = y1; y < y2; y++)
            {
                tiles.push(this.tiles[x][y])
            }
        }
        return tiles
    }
    getTileData(player)
    {
        let x1 = Math.round(player.body.pos.x) - player.perceptionstat
        if (x1 < 0) x1 = 0
        let y1 = Math.round(player.body.pos.y) - player.perceptionstat
        if (y1 < 0) y1 = 0

        let x2 = Math.round(player.body.pos.x) + player.perceptionstat
        if (x2 > this.size - 1) x2 = this.size - 1
        let y2 = Math.round(player.body.pos.y) + player.perceptionstat
        if (y2 > this.size - 1) y2 = this.size - 1

        let tiles = []
        for (let x = x1; x < x2; x++)
        {
            for (let y = y1; y < y2; y++)
            {
                tiles.push(this.tiles[x][y].getData())
            }
        }
        return tiles
    }
}