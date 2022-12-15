const Slime = require('./mobs/slime.js')
const Charger = require('./mobs/charger.js')

module.exports = function getMob(type)
{
    switch(type)
    {
        case SLIME:
            return new Slime()
        case CHARGER:
            return new Charger()
        default:
            return new Slime()
    }
}