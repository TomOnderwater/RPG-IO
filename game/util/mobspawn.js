const { chooseOne } = require("./functions")

module.exports = function getSpawn(mode)
{
    switch(mode)
    {
        case 'peaceful':
            return SLIME
        case 'normal':
            return chooseOne([SLIME, SLIME, SLIME, SLIME, SLIME, CHARGER])
        case 'hard':
            return chooseOne([SLIME, SLIME, CHARGER])
    }
    return SLIME
}