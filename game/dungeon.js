//water threshold: 0.6180857890987179
//stone treshold: 0.36184257261766134
//structure threshhold 0.3651568282751072

const protocol = require('./protocol.js')
const Player = require('./entities/player.js')
const Level = require('./level/level.js')
const Func = require('./util/functions.js')
const createItem = require('./items/item.js')
const Game = require('./gamemodes/gamemodes.js')

module.exports = class Dungeon {
    constructor(settings, key) {
        this.game = new Game(settings, this)
        this.entitycount = 1
        this.persistent = settings.persistent || false
        this.key = key
        this.ticks = 0
        this.queue = []
        this.levels = this.generateLevel(this.game.getLevelSpecs(0))
        this.game.initLevels()
        this.fullnew = false
    }
    newLevel(seed)
    {
        console.log(seed)
        this.levels = this.generateLevel(seed)
        this.fullnew = true
    }
    generateLevel(specs)
    {
        let levels = []
        let width = specs.size.width
        let height = specs.size.height
        for (let i = 0; i < specs.floorcount; i++)
        {
            let water = specs.seed.water
            let stone = specs.seed.stone
            let structurerate = specs.seed.structure
            levels.push(new Level({width, height, water, stone, structurerate}, this)) //contains tiles, which contain objects and items
        }
        return levels
    }
    end()
    {
        console.log('killing all the players')
        //kill all
        this.levels.forEach(level => level.killAll())
        console.log('scheduling for removal')
        this.ended = true
    }
    handlePlayerDisconnection(id)
    {
        this.game.removeEntry(id)
    }
    playerIsDead(id)
    {
        let player = this.getPlayer(id)
        console.log(player)
        if (!player) return true
        return player.dead()
    }
    update(connections) 
    {
        for (let i = 0; i < this.levels.length; i++)
        {
            this.levels[i].update(this.ticks)
        }
        this.game.update(connections)
        this.ticks ++
    }
    reset()
    {
        for (let i = 0; i < this.levels.length; i++)
        {
            this.levels[i].resetEvents()
            this.levels[i].clearUpdates()
        }
        this.fullnew = false
    }
    getViewPort(connection) 
    {
        let id = connection.id
        if (connection.type === 'spectator') 
        {
            let viewport = {}
            let level = this.levels[0]
            //if (this.ticks % 2 === 0) 
                viewport.entities = level.getAllEntities()
            viewport.events = level.getAllEvents()
            if (level.itemupdates.length)
            {
                viewport.itemupdates = level.getItemUpdates()
                //console.log('item update: ', viewport.itemupdates)
            }
            viewport.updates = level.getUpdates()
            viewport.builds = level.getBuildingEvents()
            let countdown = this.game.getCountDown()
            if (countdown)
                viewport.countdown = countdown
            if (this.ticks % 10 === 0)
                viewport.leaderboard = this.game.getLeaderBoard()
            return {type: 'update', data: viewport}
        }
        //let active = this.game.getPlayerAndLevel(id)
        let active = this.getPlayerAndLevel(id)
        if (this.game.respawning) //you can respawn manually (with a continue button, like survival)
        {
            if (!active)
            {
                let score = this.game.getScore(id)
                score.type = 'game over'
                return score
            } 
        }
        let viewport = {}
        if (!active)
            {
                // get the id of the killer
                let killerid = this.game.trackID(id)
                active = this.getPlayerAndLevel(killerid)
                if (!active) return // Some error handling here
                viewport.tracking = killerid
            }
        if (connection.type === 'player')
        {
            //if (this.ticks % 2 === 0) 
                viewport.entities = active.level.getEntities(active.player)
            viewport.events = active.level.getEvents(active.player)
            if (active.level.itemupdates.length)
                viewport.itemupdates = active.level.getItemUpdates()
            viewport.updates = active.level.getUpdates()
            viewport.builds = active.level.getBuildingEvents(active.player)
        }
        let inventoryUpdate = active.player.getInventoryUpdate()
        if (inventoryUpdate) viewport.inventory = inventoryUpdate
        
        let controllerFeedback = active.player.getFeedback()
            if (controllerFeedback) viewport.feedback = controllerFeedback
        // set update frequency for misc
        if (this.ticks % 10 === 0) 
            viewport.leaderboard = this.game.getLeaderBoard()

        let countdown = this.game.getCountDown()
        if (countdown)
            viewport.countdown = countdown

        return {type: 'update', data: viewport}
    }
    getLevelData(id)
    {
        if (id === 'spectator')
            return this.levels[0].getLevelData()

        let active = this.getPlayerAndLevel(id)
        if (!active) return []
        return active.level.getLevelData()
    }
    getPlayerAndLevel(id)
    {
    for (let level of this.levels)
        {
            let player = level.getPlayer(id)
            if (player) return {player, level}
        }
        return null
    }
    getCurrentLevel(id)
    {
        for (let level of this.levels)
        {
            let player = level.getPlayer(id)
            if (player) return level
        }
        return null
    }
    getPlayer(id)
    {
        for (let level of this.levels)
        {
            let player = level.getPlayer(id)
            if (player) return player
        }
        return null
    }
    getPlayerBySession(session)
    {
        for (let level of this.levels)
        {
            let player = level.getPlayerBySession(session)
            if (player) return player
        }
        return null
    }
    updateInput(input)
    {
        try 
        {
            let player = this.getPlayer(input.id)
            //console.log(player)
            if (player) player.updateInput(input.data)
        }
        catch (e)
        {
            console.log(e, 'error during input handling, disconnected?')
            return 'empty'
        }
    }
    startPlayer(id)
    {
        for (let i = this.queue.length - 1; i >= 0; i--)
        {
            if (this.queue[i].id === id) 
            {
                let player = this.queue[i]
                this.levels[0].addPlayer(player, this.game.getSpawnPos(player))
                this.game.addToLeaderBoard({id: player.id,
                                            name: player.name})
                // remove from queue
                this.queue.splice(i, 1)
            }
        }
    }
    createItem(type, count)
    {
        let item = createItem(type)
        if (count !== undefined)
            item.count = count
        else if (item.ammo) item.count = 20
        return item
    }
    assignID()
    {
        return Func.toBase64(this.entitycount ++)
    }
    addPlayer(player)
    {
        // assign an id
        let id = this.assignID()
        //create an item for the player
        //let item = this.createItem('sword')
        let new_player = new Player({
            id, session: player.session, name: player.name, 
            pos: {x: 0, y: 0}
        })

        let items = this.game.getLoadout(new_player)
        items.forEach(item => new_player.pickup(item))

        // DEPRECIATED SOON
        new_player.initHand(this.assignID())
        // add to queue
        //console.log('adding player: ', new_player.name, 'id: ', new_player.id)
        this.queue.push(new_player)
        //console.log('queued: ', this.queue)
        return {id, key: this.key}
    }
}