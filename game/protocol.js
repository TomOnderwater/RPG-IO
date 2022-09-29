
// TILE DEFINITIONS
global.STONE = 's'
global.DIRT = 'd'
global.GRASS = 'g'
global.GRAVEL = 'G'
global.WATER = 'w'
global.SAND = 'z'
global.WALL = 'x'

// STRUCTURE DEFINITIONS
global.TREE = 't'
global.AIR = 'a'

global.createItem = function(type)
{
    switch(type)
        {
            case 'sword':
                return {type: 'sword', physical: true, mass: 0.3, rad: 0.1, attack: 20, destruction: 5}
            case 'none':
                return {type: 'none', physical: true, mass: 0.1, rad: 0.05, attack: 5, destruction: 2}
            case 'bow':
                return {type: 'bow', physical: false, mass: 0.1, rad: 0.05, attack: 20, destruction: 2}
        }
}