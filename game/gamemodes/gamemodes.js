const Survival = require('./survival.js')
const Arena = require('./arena.js')

module.exports = function Game(game, dungeon)
{
    switch(game.mode)
    {
        case 'survival':
            return new Survival(game, dungeon)
        case 'arena':
            return new Arena(game, dungeon)
        default:
            return new Survival(game, dungeon)
    }
}
