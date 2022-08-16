
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
                return {type: 'sword', mass: 0.3, rad: 0.1, physical: 30}
            case 'bow':
                return {type: 'bow', mass: 0.2, rad: 0.15, physical: 8}
            case 'staff':
                return {type: 'staff', mass: 0.3, rad: 0.2, physical: 12}
            case 'none':
                return {type: 'none', mass: 0.1, rad: 0.05, physical: 5}
        }
}