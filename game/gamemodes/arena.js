const Func = require('../util/functions.js')
const riverPlains = {water: 0.45, stone: 0.36, structure: 0.36}
const stoneLands = {water: 0.00, stone: 0.5, structure: 0.36}
const meadows = {water: 0, stone: 0, structure: 0.2}

const seeds = [meadows, stoneLands, riverPlains]

const createItem = require('../items/item.js')

module.exports = class Arena
{
    constructor(game, dungeon)
    {
        this.mode = 'arena'
        this.dungeon = dungeon
        this.levelsize = game.size || {width: 32, height: 18}
        this.floorcount = 1
        this.itemticks = 30 * 30
        this.leaderboard = []
        this.ticks = 0
        this.countDownstarted = false
        this.timeLeft = 0
        this.spectators = [] //keeps watching players

        this.game_ended = false

        // CONFIGURABLE SETTINGS //
        this.availableWeapons = [BOW, FLAIL, SWORD, STAFF]
        this.weaponcount = 4
        this.roundLimit = 120
        this.mobticks = 60
        // player specific stuff
        this.naturalhealing = false
        this.maxhealth = 100
        this.timelimit = 300 // 5 minutes
    }
    initLevels(weaponcount = this.weaponcount)
    {
        this.level = this.dungeon.levels[0]
        // do stuff to make the level somewhat interesting (like dropping weapons?)
        for (let i = 0; i < weaponcount; i++)
        { //optional, fix the pos and type
            this.dropWeapon()
        }
    }
    beginGame()
    {
        // spawn the players (full health, no items (or start loadout))
        let players = [...this.level.players, ...this.spectators]

        if (players.length < 2)
        {
            this.countDownStarted = false
            return
        }
        // create the level (dungeon)
        this.dungeon.newLevel(this.getLevelSpecs())
        
        let weaponcount = (players.length > this.weaponcount) ? players.length : this.weaponcount
        //console.log(weaponcount)
        weaponcount *= 2
        // init the level with the game
        this.initLevels(weaponcount)

        //this.level.players = [] // empty level
        for (let player of players)
        {
            player.health = this.maxhealth
            player.emptyInventory()
            this.level.addPlayer(player)
        }
        // begin timer for next round
        this.timeLeft = this.roundLimit * TICKRATE
        this.countDownStarted = true
        this.spectators = []
        this.game_ended = false
    }
    getScore(id)
    {
        let entry = this.getEntry(id)
        if (!id) return {} // send an empty object
        return {name: entry.name, kills: entry.kills, wins: entry.wins}
    }
    getCountDown()
    {
        if (!this.countDownStarted) return false
        return Func.fixNumber(this.timeLeft * TICKSECONDS, 0)
    }
    dropWeapon(pos = this.level.getSpawnPos(), type = Func.chooseOne(this.availableWeapons))
    {
        let drop = {pos}
        drop.item = createItem(type)
        drop.item.count = drop.item.ammo ? 20 : 0
        this.level.placeItem(drop)
    }
    getSpawnPos(player)
    {
        return this.level.getSpawnPos(player.body)
    }
    spawnMobs()
    {
        if (this.level.mobs.length < this.level.maxMobs)
            this.level.spawnMob(SLIME, this.level.getRandomLandPos())
    }
    trackID(id)
    {
        for (let i = 0; i < this.leaderboard.length; i++)
        {
            let victims = this.leaderboard[i].victims
            for (let victim of victims)
            {
                if (victim === id) 
                    return this.leaderboard[i].id
            }
        }
        return false
    }
    addKill(killer, victim)
    {
        //console.log('killer, victim: ,', killer, victim)
        if (killer.type === PLAYER)
        {
            let killerEntry = this.getEntry(killer.id)
            if (!killerEntry) return
            if (victim.type === PLAYER)
            {
                this.spectators.push(victim)
                killerEntry.kills ++
                let victimEntry = this.getEntry(victim.id)
                killerEntry.victims = [...killerEntry.victims, victim.id, ...victimEntry.victims]
            }
            this.leaderboard.sort((a, b) => b.wins - a.wins)
        }
    }
    addToLeaderBoard(entry)
    {
        entry.victims = []
        entry.wins = 0
        entry.kills = 0
        this.leaderboard.push(entry)

        if (this.leaderboard.length > 1 && !this.countDownStarted)
        { 
            this.countDownStarted = true
            this.timeLeft = TICKRATE * 30
        }
    }
    removeEntry(id)
    {
        for (let i = this.leaderboard.length - 1; i >= 0; i--)
        {
            if (this.leaderboard[i].id === id)
            {
                this.leaderboard.splice(i, 1)
            }
        }
        this.leaderboard.sort((a, b) => b.wins - a.wins)
        if (this.leaderboard.length < 2)
            this.countDownStarted = false
    }
    getEntry(id)
    {
        for (let entry of this.leaderboard)
        {
            if (entry.id === id)
                    return entry
        } 
    }
    getLoadout(player)
    {
        return []
    }
    getLeaderBoard()
    {
        let out = {}
        out.top = []
        for (let i = 0; i < this.leaderboard.length; i++)
        {
            out.top.push({name: this.leaderboard[i].name, score: this.leaderboard[i].wins})
        }
        return out
    }
    getLevelSpecs()
    {
        return {
            seed: Func.chooseOne(seeds), 
            size: this.levelsize, 
            floorcount: this.floorcount}
    }
    handleGame()
    {
        if (!this.countDownStarted) 
        {   
            for (let player of this.level.players)
            {
                player.invulnerableticks = 2
            }
        } //return false//not playing games
        if (this.level.players.length < 2)
        {
            if (!this.game_ended)
            {
                if (this.level.players.length)
                {
                    let winner = this.level.players[0]
                    let entry = this.getEntry(winner.id)
                    entry.wins ++
                    this.leaderboard.sort((a, b) => b.wins - a.wins)
                }
                this.game_ended = true
                setTimeout(this.beginGame.bind(this), 1000)
            }
            this.game_ended = true
            return true
        }
        return false
    }
    handleCountDown()
    {
        if (!this.countDownStarted) return false
        this.timeLeft --
        return (this.timeLeft <= 0)
    }
    filterSpectators(connections)
    {
        for (let i = this.spectators.length - 1; i >= 0; i--)
        {
            let found = false
            for (let j = 0; j < connections.length; j++)
            {
                if (connections[j].id === this.spectators[i].id)
                    {
                        found = true
                        return
                    }
            }
            if (!found) this.spectators.splice(i, 1)
        }
    }
    update(connections)
    {
        this.filterSpectators(connections)

        if (this.ticks % this.mobticks === 0) 
            this.spawnMobs()
        this.ticks ++
        let countdown_ended = this.handleCountDown()
        this.handleGame()
        //if (game_ended) this.timeLeft = 30 // play the game for one more second
        if (countdown_ended)
            this.beginGame()
    }
}