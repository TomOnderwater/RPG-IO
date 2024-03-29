const Tile = require('./tile.js')
const LevelGenerator = require('./levelgeneration/levelgeneration.js')
const Func = require('../util/functions.js')
const getMob = require('../entities/mobs.js')
const RangedAttack = require('../entities/rangedattacks.js')
const GroundItem = require('./grounditems.js')
const BuildingManager = require('./building.js')
const PhysicalBody = require('../util/hitboxes.js')
const PhysicalEvent = require('./physicalevents.js')

module.exports = class Level 
{
    constructor(level, dungeon)
    {
        //this.size = level.size
        this.width = level.width
        this.height = level.height
        this.dungeon = dungeon
        this.game = dungeon.game
        
        this.tiles = new LevelGenerator(level).getTiles()
        this.players = []
        this.entities = [] // list of items in motion with a rotation, collisionstyle: box
        this.items = []
        this.events = []
        this.mobs = []
        this.maxMobs = 0.03 * this.width * this.height
        this.updates = []
        this.rangedattacks = []
        this.physicalevents = [] // stuff like explosions and fires
        this.itemupdates = []
        this.buildManager = new BuildingManager(this)
        //this.addRandomItems()
    }
    killAll()
    {
        this.players.forEach(player => player.health = -1000) // effective kill
    }
    getRandomLandPos()
    {
        let pos = this.randomPos()
        let tile = this.getTile(pos)
        if (tile.surface === WATER) // TRY AGAIN
            return this.getRandomLandPos()
        return pos
    }
    getSpawnPos(body = new PhysicalBody())
    {
        let startpos = this.getRandomLandPos()
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
        //console.log('checking: ', session, this.players)
        for (let player of this.players)
        {
            //console.log('checking:', session, player.session, player)
            if (session === player.session) return player
        }
        return null
    }
    addRandomItems(count)
    {
        const options = [WOOD, STONE, AMMO]
        for (let i = 0; i < count; i++)
        {
            let item = {item: {type: Func.chooseOne(options), count: 1}, pos: this.randomPos()}
            this.placeItem(item)
        }
    }
    getItemUpdates()
    {
        return this.itemupdates
    }
    addDrops(drops)
    {
        drops.forEach(drop => this.placeItem(drop))
    }
    placeItem(data)
    {
        data.id = this.dungeon.assignID() // assign ID
        let item = new GroundItem(data)
        this.items.push(item)
        let d = item.data()
        d.n = 1 // flag as incoming
        this.itemupdates.push(d)
    }
    updateGroundItems(entities)
    {
        for (let i = this.items.length - 1; i >= 0; i--)
        {
            let pickup = this.items[i].update(entities)
            if (pickup)
            {
                let data = this.items[i].data()
                data.n = 0 // flag as outgoing
                this.itemupdates.push(data)
                this.items.splice(i, 1)
            }
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
            if (ended) this.rangedattacks.splice(i, 1)
        }
    }
    addPhysicalEvent(data)
    {
        this.physicalevents.push(new PhysicalEvent(data, this))
    }
    updatePhysicalEvents(entities)
    {
        for (let i = this.physicalevents.length - 1; i >= 0; i--)
        {
            let ended = this.physicalevents[i].update(this, entities)
            if (ended) this.physicalevents.splice(i, 1)
        }
    }
    update(ticks)
    {
        //spawn mobs
        let entities = [...this.players, ...this.entities, ...this.mobs] //collect everything
        for (let i = 0; i < entities.length; i++)
        {
            entities[i].update(this, entities)
        }
        this.updateBuildManager()
        this.updateRangedAttacks(entities)
        this.updatePhysicalEvents(entities)
        this.updateGroundItems(this.players)
        let recoverytick = ((ticks % 30) === 0 && this.game.naturalhealing)
        if (recoverytick) 
            this.killOutOfBounds()
        
        for (let i = this.players.length - 1; i >= 0; i--)
        {
            let player = this.players[i]
            if (player.dead()) 
            {
                // get killer
                this.addDrops(player.getDrop())
                let killer = this.getEntity(player.lastattacker)
                if (killer !== null)
                    this.game.addKill(killer, player)
                else this.game.addKill({type: 'nature'}, player)
                this.players.splice(i, 1)
            }
            else if (recoverytick)
                player.recover()
        }
        for (let i = this.mobs.length - 1; i >= 0; i--)
        {
            let mob = this.mobs[i]
            if (mob.dead())
            {
                this.addDrops(mob.getDrop())
                let killer = this.getEntity(mob.lastattacker)
                if (killer !== null)
                    this.game.addKill(killer, mob)
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
        this.itemupdates = []
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
                        this.addDrops(items)
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
            this.getPlayer(building.id).inventory.remove({
                type: building.type, 
                count: 1
            })
            let tile = this.getTile(building.pos)
            switch(building.type)
            {
                case WOOD:
                    tile.addStructure(WOODWALL)
                break
                case ROCK:
                    tile.addStructure(STONEWALL)
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
            if (this.outOfBounds(pos))
                entity.health = -100
        }
    }
    addTreasureChest(p)
    {
        let pos = p || this.getRandomLandPos()
        if (this.isFreeTile(pos))
        {
            let tile = this.getTile(pos)
            tile.addStructure(TREASURECHEST)
            this.updates.push(tile.getData())
        }
    }
    getLeaderBoard()
    {
        let out = []
        for (let player of this.players)
        {
            let entry = {name: player.name, id: player.id}
            entry.score = player.inventory.ammo
            out.push(entry)
        }
        return out
    }
    randomPos()
    {
        let x = 1 + (Math.random() * (this.width - 2))
        let y = 1 + (Math.random() * (this.height - 2))
        return {x, y}
    }
    spawnMob(type, pos)
    {
        let mob = getMob(type)
        mob.id = this.dungeon.assignID()
        let spawnpos = this.getFreeSpot(pos, mob.body)
        mob.body.pos = spawnpos
        //console.log('slime spawned')
        this.mobs.push(mob)
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
        return events
    }
    resetEvents()
    {
        this.events = []
    }
    addEvent(event)
    {
        this.events.push(event)
    }
    closeBodies(pos, colliders, range)
    {
        let close = this.getStructures(pos, range)
        for (let collider of colliders)
        {
            if (Func.inRange(pos, collider.body.pos, range)) close.push(collider.body) 
        }
        return close
    }
    isFreeTile(_pos) //check if there's something on the tile
    {
        let colliders = [...this.players, ...this.entities, ...this.mobs]
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
        if (pos.x === undefined || pos.x === NaN || pos.y === undefined || pos.y === NaN) return true
        if (pos.x >= 0 && pos.x <= this.width && pos.y >= 0 && pos.y <= this.height) return false
        return true
    }
    getAllEntities()
    {
        let entities = [] //everything else
        for (let i = 0; i < this.players.length; i++)
        {
            entities.push(this.players[i].data())
            entities.push(this.players[i].getHand())
        }
        for (let i = 0; i < this.mobs.length; i++)
        {
            entities.push(this.mobs[i].data())
        }
        for (let i = 0; i < this.rangedattacks.length; i++)
        {
            entities.push(this.rangedattacks[i].data())
        }
        return entities 
    }
    getGroundSpeed(pos)
    {
        if (this.outOfBounds(pos))
            return 0
        let x = Math.floor(pos.x)
        let y = Math.floor(pos.y)
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
        /*
        for (let item of this.items)
        {
            if(Func.inRange(player.body.pos, item.body.pos, player.perceptionstat))
                    entities.push(item.data())
        }
        */
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
    getAllStructures(type)
    {
        let out = []
        for (let x = 0; x < this.width; x++)
        {
            for (let y = 0; y < this.height; y++)
            {
                if (this.tiles[x][y].structure.id === type)
                    out.push(this.tiles[x][y].structure)
            }
        }
        return out
    }

    getTile(pos)
    {
        let x = Func.constrain(Math.floor(pos.x), 0, this.width - 1)
        let y = Func.constrain(Math.floor(pos.y), 0, this.height - 1)
        return this.tiles[x][y]
    }
    getTiles(pos, range = this.level.width)
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
    getItems()
    {
        let out = []
        for (let item of this.items)
        {
            let data = item.data()
            data.n = 1
            out.push(data)
        }
        return out
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
        return {width: this.width, height: this.height, cols, items: this.getItems(), key: this.dungeon.key}
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