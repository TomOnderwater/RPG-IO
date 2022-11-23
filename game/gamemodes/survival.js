const Func = require('../util/functions.js')
const riverPlains = {water: 0.61, stone: 0.36, structure: 0.36}
const startitems = [BOW, SWORD]

module.exports = class Survival
{
    constructor(game, dungeon)
    {
        this.mode = 'survival'
        this.dungeon = dungeon
        this.levelsize = game.size || {width: 100, height: 100}
        this.floorcount = game.floorcount || 1
        this.leaderboard = []
        this.finalscores = []
        this.treasurechestticks = 3000 // about 100 seconds
        this.mobticks = 60
        this.naturalhealing = true
        this.respawning = true
        this.maxtreasurechests = Math.round((game.size.width * game.size.height) * 0.002)
        this.ticks = 0
    }
    initLevels()
    {
    for (let level of this.dungeon.levels)
        {
            for (let i = 0; i < this.maxtreasurechests; i++)
            {
                level.addTreasureChest()
            }
        }
    }
    getSpawnPos(player)
    {
        return this.dungeon.levels[0].getSpawnPos(player.body)
    }
    spawnMobs()
    {
        for (let level of this.dungeon.levels)
        {
            if (level.mobs.length < level.maxMobs)
            {
                let chests = level.getAllStructures(TREASURECHEST)
                let chest = Func.chooseOne(chests)
                let pos = (!chest || this.ticks % (this.mobticks * 2) === 0) ?  
                level.getRandomLandPos() : chest.body.getCenter()
                level.spawnMob(SLIME, pos)
            } 
        }
    }
    addKill(killer, victim)
    {
        if (killer.type === PLAYER)
        {
            let killerEntry = this.getEntry(killer.id)
            if (victim.type === PLAYER)
        {
            //let victimEntry = this.getEntry(victim.id)
            //killerEntry.score += Math.round(victimEntry.score * 0.5)
            killerEntry.victims = [...killerEntry.victims, victim.id]
            this.removeEntry(victim.id)
        }
        else killerEntry.score += 10

        this.leaderboard.sort((a, b) => b.score - a.score)
        return
        }
        if (victim.type === PLAYER)
            this.removeEntry(victim.id)
    }
    addToLeaderBoard(entry)
    {
        entry.victims = []
        entry.score = 0
        this.leaderboard.push(entry)
    }
    getFinalScore(id)
    {
        let out = false
        for (let i = this.finalscores.length - 1; i >= 0; i--)
        {
            if (this.finalscores[i].id === id)
            {
                out = this.finalscores[i]
                this.finalscores.splice(i, 1)
                break
            }
        }
        return out
    }
    getEntry(id)
    {
        for (let entry of this.leaderboard)
        {
            if (entry.id === id)
                    return entry
        }
        return false 
    }
    removeEntry(id)
    {
        //console.log('removing:', id)
        for (let i = this.leaderboard.length - 1; i >= 0; i--)
        {
            if (this.leaderboard[i].id === id)
            {
                this.finalscores.push(this.leaderboard[i])
                this.leaderboard.splice(i, 1)
            }
        }
        this.leaderboard.sort((a, b) => b.score - a.score)
    }

    updateLeaderBoard()
    {
        this.leaderboard = []
        for (let level of this.dungeon.levels)
        {
            let entries = level.getLeaderBoard()
            for (let entry of entries)
            {
                this.leaderboard.push(entry)
            }
        }
        this.leaderboard.sort((a, b) => b.score - a.score)
    }
    getScore(id)
    {
        let entry = this.getEntry(id)
        if (!entry) entry = this.getFinalScore(id)
        if (!entry) return {} // send an empty object
        return {name: entry.name, score: entry.score}
    }
    getLoadout(player)
    {
        let items = []
        switch(player.name)
        {
            case 'Art':
                items.push(this.dungeon.createItem(BOW, 999))
                items.push(this.dungeon.createItem(FLAIL))
                items.push(this.dungeon.createItem(STAFF, 20))
            break
            case 'Tom':
                items.push(this.dungeon.createItem(BOW, 100))
                items.push(this.dungeon.createItem(SWORD))
                items.push(this.dungeon.createItem(STAFF, 100))
                items.push(this.dungeon.createItem(FLAIL))
            break
            case 'Porno elf':
                items.push(this.dungeon.createItem(FLAIL), 69)
            break
            default:
                items.push(this.dungeon.createItem(Func.chooseOne(startitems)))
            break
        }
        return items
    }
    getCountDown()
    {
        return false
    }
    getLeaderBoard(visible)
    {
        let out = {}
        out.top = []
        for (let i = 0; i < this.leaderboard.length; i++)
        {
            out.top.push(this.leaderboard[i])
        }
        return out
    }
    getLevelSpecs()
    {
        return {
            seed: riverPlains, 
            size: this.levelsize, 
            floorcount: this.floorcount}
    }
    update()
    {
        if (this.ticks % this.treasurechestticks === 0)
        {
            for (let level of this.dungeon.levels)
            {
                let chests = level.getAllStructures(TREASURECHEST)
                if (chests.length < this.maxtreasurechests)
                    level.addTreasureChest()
            }
        }
        if (this.ticks % this.mobticks === 0) 
            this.spawnMobs()
        this.ticks ++
    }
}