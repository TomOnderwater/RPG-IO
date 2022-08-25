
/* RPG-IO CONCEPT
    RPG-IO is a multi-level mobile dungeon crawler. The game is meant to be playable for a few minutes to a couple of hours. It is 
    constructed as a top down mmorpg thay you play in the browser.
        In the game you spawn on the top level of a dungeon, carrying nothing but a simple wooden sword. The way back up is blocked, 
    so you decide to take the plunge. 
        Soon you find yourself surrounded by enemies. Luckily, they're only slimes, which you can handle learning how to 
    swing your sword. Their gelatonous bodies are weak and fragile and shatter after only one or two hits, whilst they can
    barely scratch you, if they even notice you at all.
    They're no big deal. 
        But they do leave a mess. You try not to step on it. 
    You wonder if slimes have emotions as you mercilessly slice apart their squishy bodies.
        Suddenly the next slime parries your sword with some stick the blob just got stuck in its body when 
    munching leaves under a tree.
        Your sword cracks as it collides at a badly executed angle. That was sloppy, if you just payed a bit more attention 
    you could have easily avoided that. Or maybe it was lag. You don't know.
        You gasp in horror as your trusty weapon shatters, leaving you barehanded and surrounded by enemies. 
        You back away and stumble. The slime jiggles after the impact, but is quick to regain its stupor.
    Its buddies line up behind, and the monsters squish ever closer. The mob careful to stay behind their leader.
        The slime almost seems to grin as it approaches. But how could it smile? It's only gelatin.
    But the stick this gelatin wields is starting to look awfully large. It apparently figured out how to swing it.
    It eagerly approaches, there's no easy way back, it's sticky, and more importantly -- how could you look anyone in the eyes 
    ever again after running away from gelatin?
        You consider your options. 
        With half your health left, you've got a good chance of beating it. But the only weapon is the skin of your fist...
        You're not sure if you're ready for that, but you decide to take the plunge before you dare consider it further and 
    launch an attack just as the slime swings the stick.
        It all seems to happen in slow motion.
        Your hand crashes against the sharp branches portruding from the stick, swiping the skin of your hand. The wood is harder
    than you thought, your fingerbones crack under the stress.
        Blood sprays. Your blood. Your health keeps diving as you keep pushing on the stick. You grit your teeth against the pain.
        It works, the stick is deflected. You launch again, and this time the slime isn't ready as you smash it. 
        The fucker did snark. You watch the frozen expression splinter apart in seperate pieces of gelatin, no longer moving. 
        
        Slimes do have emotions. 

        A blue light surrounds you, it is so beautiful that it must be divine. The pain in your hand dissapears.
        
        There's a message.

        [LVL UP! 1->2 Points available: 1']

        You grasp the light surrounding you and are confronted with your options.

        tbc
*/

const protocol = require('./protocol.js')
const Player = require('./player.js')
const Level = require('./level.js')

module.exports = class Dungeon {
    constructor(floorcount) {
        this.levels = this.generateLevel(floorcount)
        this.entitycount = 1
        this.queue = []
        this.ticks = 0
        this.scores = []

        console.log(STONE)
    }
    generateLevel(floorcount)
    {
        let levels = []
        for (let i = 0; i < floorcount; i++)
        {
            let water = Math.random() * 0.7 //don't produce full seas
            let stone = 0.2 + Math.random() * 0.6 //always keep some stone
            let structurerate = 0.2 + Math.random() * 0.4 //somewhat sparse
            console.log('floor:', i)
            console.log('water threshold:', water)
            console.log('stone treshold:', stone)
            console.log('structure threshhold', structurerate)
            levels.push(new Level({size: 100, water, stone, structurerate}, this)) //contains tiles, which contain objects and items
        }
        return levels
    }
    addScore(score, id, deathcause)
    {
        this.scores.push({score, id, deathcause})
    }
    update() 
    {
        this.levels.forEach(level => level.update())
        this.ticks ++
    }
    resetEvents()
    {
        this.levels.forEach(level => level.resetEvents())
    }
    getScore(id)
    {
        //let outpu
        for (let i = this.scores.length - 1; i >= 0; i--)
        {
            if (this.scores[i].id === id) return this.scores[i].deathcause.name
        }
    }
    getViewport(id) 
    {
        let active = this.getPlayerAndLevel(id)
        if (!active) 
            return this.getScore(id)

        let viewport = {}
        // update entities on high frequency
        viewport.entities = active.level.getEntities(active.player)

        //update events
        viewport.events = active.level.getEvents(active.player)
        let inventoryUpdate = active.player.getInventoryUpdate()
        if (inventoryUpdate) viewport.inventory = inventoryUpdate
        
        // test perception
        //viewport.perception = active.player.getPerception(active.level)

        // set update frequency for level
        if (this.ticks % 10 === 0) viewport.tiles = active.level.getTileData(active.player)

        return {type: 'update', data: viewport}
    }
    getPlayerAndLevel(id)
    {
    for (let level of this.levels)
        {
            let player = level.getPlayer(id)
            if (player) return {player, level}
        }
        return null
    }
    getCurrentLevel(id)
    {
        for (let level of this.levels)
        {
            let player = level.getPlayer(id)
            if (player) return level
        }
        return null
    }
    getPlayer(id)
    {
        for (let level of this.levels)
        {
            let player = level.getPlayer(id)
            if (player) return player
        }
        return null
    }
    getPlayerBySession(session)
    {
        for (let level of this.levels)
        {
            let player = level.getPlayerBySession(session)
            if (player) return player
        }
        return null
    }
    updateInput(id, input)
    {
        try 
        {
            let player = this.getPlayer(id)
            //console.log(player)
            if (player) player.updateInput(input)
        }
        catch (e)
        {
            console.log(e, 'error during input handling, disconnected?')
            return 'empty'
        }
    }
    startPlayer(id)
    {
        for (let i = this.queue.length - 1; i >= 0; i--)
        {
            if (this.queue[i].id === id) 
            {
                //console.log('player ready:', this.queue[i])
                // add player to level
                this.levels[0].addPlayer(this.queue[i])
                // remove from queue
                this.queue.splice(i, 1)
            }
        }
    }
    assignID()
    {
        return this.entitycount ++
    }
    // createItem(type)
    // {
    //     //returns an item
    //     switch(type)
    //     {
    //         case 'sword':
    //             return {type: 'sword', mass: 0.3, damage: 5}
    //         case 'bow':
    //             return {type: 'bow', mass: 0.2, damage: 3}
    //         case 'staff':
    //             return {type: 'staff', damage: 8}
    //     }
    // }
    addPlayer(player)
    {
        // assign an id
        let id = this.assignID()
        //create an item for the player
        //let item = this.createItem('sword')
        let new_player = new Player({id, session: player.session, name: player.name, pos: {x: 0, y:0}})
        new_player.pickup([createItem('sword')])
        new_player.initHand(this.assignID()) // assign an id for the item in hand
        // add to queue
        console.log('adding player: ', new_player)
        this.queue.push(new_player)
        //console.log('queued: ', this.queue)
        return id
    }
}