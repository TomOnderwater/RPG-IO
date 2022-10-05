const Tile = require('./tile.js')
const LevelGenerator = require('./levelgeneration.js')
const Func = require('./functions.js')
const Mobs = require('./mobs.js')
const RangedAttack = require('./rangedattacks.js')
const GroundItem = require('./grounditems.js')
const BuildingManager = require('./building.js')
const PhysicalBody = require('./hitboxes.js')

module.exports = class Level 
{
    constructor(level, dungeon)
    {
        //this.size = level.size
        this.width = level.width
        this.height = level.height
        this.dungeon = dungeon
        this.tiles = new LevelGenerator(level).getTiles()
        this.players = []
        this.entities = [] // list of items in motion with a rotation, collisionstyle: box
        this.items = []
        this.events = []
        this.mobs = []
        this.maxMobs = 0.05 * this.width * this.height
        this.updates = []
        this.rangedattacks = []
        this.buildManager = new BuildingManager(this)
        this.addRandomItems()
    }
    killAll()
    {
        this.players.forEach(player => player.health = -1000) // effective kill
    }
    getSpawnPos(body)
    {
        //return {x: this.size / 2, y: this.size / 8}
        //let startpos = {x: this.width / 2, y: this.height / 8}
        let startpos = this.randomPos()
        console.log('start pos: ', startpos)
        return this.getFreeSpot(startpos, body)
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
    getEntity(id)
    {
        let entities = [...this.mobs, ...this.players]
        for (let entity of entities)
        {
            if (entity.id === id) return entity
        }
        return null
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
    addRandomItems()
    {
        for (let i = 0; i < 100; i++)
        {
            let item = {item: {type: WOOD, count: 1}, pos: this.randomPos()}
            this.placeItem(item)
        }
    }
    placeItem(data)
    {
        data.id = this.dungeon.assignID() //is handled like an entity
        this.items.push(new GroundItem(data))
    }
    updateGroundItems(entities)
    {
        for (let i = this.items.length - 1; i >= 0; i--)
        {
            let pickup = this.items[i].update(entities)
            if (pickup)
                this.items.splice(i, 1)
        }
    }
    addRangedAttack(data)
    {
        data.id = this.dungeon.assignID()
        this.rangedattacks.push(new RangedAttack(data))
    }
    updateRangedAttacks(entities)
    {
        for (let i = this.rangedattacks.length - 1; i >= 0; i--)
        {
            let ended = this.rangedattacks[i].update(this, entities)
            if (ended) console.log('hit')
            if (ended) this.rangedattacks.splice(i, 1)
        }
    }
    update(ticks)
    {
        //spawn mobs
        this.spawnMobs()
        let entities = [...this.players, ...this.entities, ...this.mobs] //collect everything
        entities.forEach(entity => entity.update(this, entities))

        // update buildings being built
        this.updateBuildManager()
        this.updateRangedAttacks(entities)
        this.updateGroundItems(this.players)
        let recoverytick = ((ticks % 30) === 0)
        if (recoverytick) 
            this.killOutOfBounds()
        for (let i = this.players.length - 1; i >= 0; i--)
        {
            let player = this.players[i]
            if (player.dead()) 
            {
                // get killer
                let killer = this.getEntity(player.lastattacker)
                if (killer !== null)
                {
                    killer.addXP(player.getXP()) //add XP to killer
                    this.dungeon.addScore({score: player.getScore(), 
                                            id: player.id, 
                                            name: player.name,
                                            killer: killer.name})
                }
                else 
                this.dungeon.addScore({score: player.getScore(), 
                                            id: player.id, 
                                            name: player.name,
                                            killer: 'natural causes'})
                this.players.splice(i, 1)
                console.log('player died', this.players)
            }
            else if (recoverytick)
                player.recover()
        }
        for (let i = this.mobs.length - 1; i >= 0; i--)
        {
            let mob = this.mobs[i]
            if (mob.dead())
            {
                let killer = this.getEntity(mob.lastattacker)
                if (killer !== null)
                {
                    console.log(mob.type, 'killed by', killer.name)
                    killer.addXP(mob.getXP()) // add XP to killer
                }
                //mob.killer.addXP(mob.getXP()) // add XP to killer
                this.mobs.splice(i, 1)
            }
            else if (recoverytick) 
                mob.recover()
        }
        this.updateStructures()
    }
    getUpdates()
    {
        return this.updates
    }
    clearUpdates()
    {
        this.updates = []
    }
    updateStructures()
    {
        // destroy structures that are dead
        for (let x = 0; x < this.width; x++)
        {
            for (let y = 0; y < this.height; y++)
            {
                let tile = this.tiles[x][y]
                if (tile.structure !== AIR)
                {
                    if (tile.structure.health <= 0)
                    {
                        let items = tile.destroyStructure()
                        items.forEach(item => this.placeItem(item))
                        this.updates.push(tile.getData())
                    }
                }
            }
        }
    }
    build(hand)
    {
        // check if it is a continued building event
        this.buildManager.build(hand)
    }
    updateBuildManager()
    {
        let completed = this.buildManager.update()
        // do something with the completed buildings
        for (let building of completed)
        {
            this.getPlayer(building.id).removeItem({
                type: building.type, 
                count: 1
            })
            let tile = this.getTile(building.pos)
            switch(building.type)
            {
                case WOOD:
                    tile.addWoodWall()
                break
                case ROCK:
                    tile.addStoneWall()
                break
                default:
                    console.log('building type not recognized')
                break
            }
            this.updates.push(tile.getData())
        }
    }
    killOutOfBounds()
    {
        let entities = [...this.players, ...this.mobs]
        for (let entity of entities)
        {
            let pos = entity.body.pos
            if (pos.x <= 0 || pos.x >= this.width || pos.y <= 0 || pos.y >= this.height)
                entity.health = -100
        }
    }
    getLeaderBoard()
    {
        let out = []
        for (let player of this.players)
        {
            out.push(player.getScore())
        }
        return out
    }
    spawnMobs()
    {
        if (this.mobs.length < this.maxMobs) this.spawnMob(SLIME)
    }
    randomPos()
    {
        let x = 1 + (Math.random() * (this.width - 2))
        let y = 1 + (Math.random() * (this.height - 2))
        return {x, y}
    }
    spawnMob(type)
    {
        let slime = new Mobs.Slime({x: 0, y: 0}, this.dungeon.assignID())
        let spawnpos = this.getFreeSpot(this.randomPos(), slime.body)
        slime.body.pos = spawnpos
        //console.log('slime spawned')
        this.mobs.push(slime)
    }
    getBuildingEvents(player)
    {
        if (player !== undefined)
        {
            let buildingevents = []
            let sqrange = player.perceptionstat * player.perceptionstat
            for (let be of this.buildManager.buildingevents)
            {
                if (Func.sqDist(player.body.pos, be.pos) < sqrange)
                    buildingevents.push(be.progressData())
            }
            return buildingevents
        }
        return this.buildManager.getPreviews()
    }
    getAllEvents()
    {
        return this.events
    }
    getEvents(player)
    {
        let events = []
        let sqrange = player.perceptionstat * player.perceptionstat
        this.events.forEach(event =>
        {
            if (Func.sqDist(player.body.pos, event.pos) < sqrange)
                events.push(event)
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
        //console.log('new event:', event)
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
    isFreeTile(_pos) //check if there's something on the tile
    {
        let colliders = [...this.players, ...this.entities, ...this.rangedattacks, ...this.mobs]
        // create a square body
        let pos = {
            x: Func.constrain(Math.floor(_pos.x), 0, this.width - 1),
            y: Func.constrain(Math.floor(_pos.y), 0, this.height - 1)
        }
        let close = this.closeBodies(pos, colliders, 2)
        let body = new PhysicalBody({type: 'rect', pos: Func.add(pos, {x:0.05, y:0.05}), width: 0.9, height:0.9})
        for (let collider of close)
        {
            if (body.collide(collider)) 
                return false
        }
        return true
    }
    getFreeSpot(testpos, body)
    {
        // first round, test original
        let colliders = [...this.players, ...this.entities, ...this.mobs, ...this.rangedattacks]
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

                if (body.virtualCollision(testpos, collider) || this.outOfBounds(testpos))
                {
                    // collision! get a new random pos
                    testpos = {x: original.x + (Math.random() - 0.5) * maxdist, y: original.y + (Math.random() - 0.5) * maxdist}
                    maxdist += 0.2
                    resolved = false
                    break
                }
            }
            if (resolved) break
        }
        return testpos
    }
    outOfBounds(pos)
    {
        if (pos.x >= 0 && pos.x <= this.width && pos.y >= 0 && pos.y <= this.height) return false
        return true
    }
    getAllEntities()
    {
        let entities = [] //everything else
        for (let player of this.players)
        {
            entities.push(player.data())
            entities.push(player.getHand())
        }
        this.mobs.forEach(mob => entities.push(mob.data()))
        this.rangedattacks.forEach(rangedattack => entities.push(rangedattack.data()))
        this.items.forEach(item => entities.push(item.data()))
        return entities 
    }
    getGroundSpeed(pos)
    {
        let x = Func.constrain(Math.floor(pos.x), 0, this.width)
        let y = Func.constrain(Math.floor(pos.y), 0, this.height)
        return this.tiles[x][y].groundSpeed()
    }

    getEntities(player)
    {
        let entities = [] //everything else
        for (let other of this.players)
        {
            entities.push(other.data())
            entities.push(other.getHand())
        }
        for (let mob of this.mobs)
        {
            // check in range:
            if (Func.inRange(player.body.pos, mob.body.pos, player.perceptionstat))
                entities.push(mob.data())
        }
        for (let rangedattack of this.rangedattacks) 
            {
                if(Func.inRange(player.body.pos, rangedattack.body.pos, player.perceptionstat))
                    entities.push(rangedattack.data())
            }
        for (let item of this.items)
        {
            if(Func.inRange(player.body.pos, item.body.pos, player.perceptionstat))
                    entities.push(item.data())
        }
        return entities
    }
    getStructures(pos, range)
    {
        let tiles = this.getTiles(pos, range)
        let structures = []
        for (let tile of tiles)
        {
            if (tile.structure.id !== AIR) structures.push(tile.getStructure())
        }
        return structures
    }
    getTile(pos)
    {
        let x = Func.constrain(Math.floor(pos.x), 0, this.width - 1)
        let y = Func.constrain(Math.floor(pos.y), 0, this.height - 1)
        return this.tiles[x][y]
    }
    getTiles(pos, range)
    {
        let x1 = Func.constrain(Math.round(pos.x - range), 0, this.width)
        let x2 = Func.constrain(Math.round(pos.x + range), 0, this.width)
        let y1 = Func.constrain(Math.round(pos.y - range), 0, this.height)
        let y2 = Func.constrain(Math.round(pos.y + range), 0, this.height)

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
    getLevelData()
    {
        let cols = []
        for (let x = 0; x < this.width; x++)
        {
            let col = []
            for (let y = 0; y < this.height; y++)
            {
                col.push(this.tiles[x][y].getData())
            }
            cols.push(col)
        }
        return {width: this.width, height: this.height, cols}
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