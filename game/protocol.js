
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
global.ROCK = 'r'

// entity definitions
global.PLAYER = 'p'
global.SLIME = 's'

// item definitions
global.SWORD = 'S'
global.WOOD = 'W'
global.BOW = 'B'
global.ARROW = 'A'
global.NONE = 'N'

global.createItem = function(type)
{
    switch(type)
        {
            case SWORD:
                return {
                    type: SWORD, 
                    physical: true, 
                    mass: 0.3, 
                    reach: 0.01, 
                    rad: 0.1, 
                    attack: 20, 
                    destruction: 5,
                    bounce: 0.7
                }
            case NONE:
                return {
                    type: NONE, 
                    physical: true, 
                    mass: 0.1, 
                    reach: 0.01, 
                    rad: 0.05, 
                    attack: 5, 
                    destruction: 2}
            case BOW:
                return {
                    type: BOW, 
                    physical: false, 
                    mass: 0.1, 
                    reach: 0.0025, 
                    rad: 0.05, 
                    attack: 40, 
                    destruction: 2}
            case WOOD:
                return {
                    type: WOOD, 
                    physical: false, 
                    mass: 0.1, 
                    reach: 0.01, 
                    rad: 0.1, 
                    attack: 0, 
                    destruction: 0}
        }
}