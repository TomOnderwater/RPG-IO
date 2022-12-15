const Func = require("./functions")

module.exports = function getSpawn(mode)
{
    switch(mode)
    {
        case 'easy':
            return Func.chooseOne([...Array(20).fill(SLIME), CHARGER])
        case 'normal':
            return Func.chooseOne([...Array(5).fill(SLIME), CHARGER])
        case 'hard':
            return Func.chooseOne([...Array(2).fill(SLIME), CHARGER])
    }
    return SLIME
}