const riverPlains = {water: 0.61, stone: 0.36, structure: 0.36}

class Survival
{
    constructor(game, dungeon)
    {
        this.mode = 'survival'
        this.dungeon = dungeon
        this.levelsize = game.size || {width: 100, height: 100}
        this.floorcount = game.floorcount || 1
        this.leaderboard = []
        this.scores = []
    }
    getSpawnPos(player)
    {
        return this.dungeon.levels[0].getSpawnPos(player.body)
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
        let out = false
            for (let i = this.scores.length - 1; i >= 0; i--)
            {
                if (this.scores[i].id === id)
                    {
                        out = this.scores[i]
                        this.scores.splice(i, 1)
                        break
                    } 
            }
        if (out)
        {
            out.type = 'game over'
            return out
        }
    }
    getLoadout(player)
    {
        let items = []
        switch(player.name)
        {
            case 'Art':
                items.push(this.dungeon.createItem(BOW, 999))
                items.push(this.dungeon.createItem(SWORD))
                items.push(this.dungeon.createItem(STAFF, 20))
            break
            case 'Tom':
                items.push(this.dungeon.createItem(BOW, 20))
                items.push(this.dungeon.createItem(SWORD))
                items.push(this.dungeon.createItem(STAFF, 100))
            break
            case 'porno elf' || 'Porno elf':
                items.push(this.dungeon.createItem(SWORD))
            break
            default:
                items.push(this.dungeon.createItem(BOW, 20))
                items.push(this.dungeon.createItem(SWORD))
            break
        }
        return items
    }
    getLeaderBoard(visible)
    {
        let out = {}
        out.top = []
        for (let i = 0; i < visible || 5 && i < this.leaderboard.length; i++)
        {
            out.top.push(this.leaderboard[i])
        }
        return out
    }
    addScore(score)
    {
        this.scores.push(score)
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

    }
}


module.exports = function Game(game, dungeon)
{
    switch(game.mode)
    {
        case 'arena':
            return new Survival(game, dungeon)
        default:
            return new Survival(game, dungeon)
    }
}