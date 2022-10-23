const Survival = require('./survival.js')

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