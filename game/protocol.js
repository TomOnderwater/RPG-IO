
// GROUND TILE DEFINITIONS
global.STONE = 's'
global.DIRT = 'd'
global.GRASS = 'g'
global.GRAVEL = 'G'
global.WATER = 'w'
global.SAND = 'z'
global.WALL = 'x'
global.STONEWALL = '/'
global.WOODWALL = ']'

// STRUCTURE DEFINITIONS
global.TREE = 't'
global.AIR = 'a'

// entity definitions
global.PLAYER = 'p'
global.SLIME = 's'

// MATERIAL DEFINITIONS
global.WOOD = 'W'
global.ROCK = 'r'

// item definitions
global.SWORD = 'S'
global.BOW = 'B'
global.STAFF = '@'
global.ARROW = 'A'
global.FIREBALL = '$'
global.NONE = 'N'
global.AMMO = '*'

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
                    building: false, 
                    rad: 0.1, 
                    attack: 20, 
                    destruction: 3,
                    bounce: 0.4,
                    persistent: true,
                    ammo: false}
            case NONE:
                return {
                    type: NONE, 
                    physical: true,
                    building: false, 
                    mass: 0.1, 
                    reach: 0.01, 
                    rad: 0.05, 
                    attack: 5, 
                    destruction: 3,
                    bounce: 0.4,
                    persistent: true,
                    ammo: false}
            case BOW:
                return {
                    type: BOW, 
                    physical: false,
                    building: false, 
                    mass: 0.1, 
                    reach: 0.0025, 
                    rad: 0.05, 
                    attack: 40, 
                    destruction: 2,
                    minimumdraw: 0.15,
                    bounce: 0.4,
                    persistent: true,
                    projectile: ARROW,
                    ammo: true}
            case STAFF:
                return {
                    type: STAFF, 
                    physical: false,
                    building: false, 
                    mass: 0.1, 
                    reach: 0.005, 
                    rad: 0.05, 
                    attack: 50, 
                    destruction: 25,
                    bounce: 0.4,
                    persistent: true,
                    minimumdraw: 0.1,
                    projectile: FIREBALL,
                    ammo: true}
            case WOOD:
                return {
                    type: WOOD, 
                    physical: false,
                    building: true, 
                    mass: 0.1, 
                    reach: 0.01, 
                    rad: 0.1, 
                    attack: 0, 
                    destruction: 0,
                    persistent: false,
                    bounce: 0.4,
                    ammo: false}
            case ROCK:
                return {
                    type: ROCK, 
                    physical: false,
                    building: true, 
                    mass: 0.1, 
                    reach: 0.01, 
                    rad: 0.1, 
                    attack: 0, 
                    destruction: 0,
                    bounce: 0.4,
                    persistent: false,
                    ammo: false}
        }
}