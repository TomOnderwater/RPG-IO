const Dungeon = require("./game/dungeon.js")

function generateKey(len) // creates some random key to display on screen
    {
    let str = ""
    for (let i = 0; i < len; i++)
    {
        let char = String.fromCharCode(Math.floor((Math.random() * 26)) + 97)
        str += char
    }
    return str
    }

module.exports = class GameMaster
{
    constructor()
    {
        this.dungeons = []
        this.connections = []
        this.ticks = 0
        // base dungeon
        this.dungeons.push(new Dungeon(1, 100, 100, this.createKey(5)))
        console.log('dungeons: ', this.dungeons, this.dungeons[0].key)
        // example {socket: bla bla, id: '1, 2, 3, spectator', key: 'adfei'}
    }

    addDungeon()
    {

        // 1 floor, 32 wide, 18 high
        let dungeon = new Dungeon(1, 32, 18, this.createKey(5))
        this.dungeons.push(dungeon)
        return dungeon
    }
    getDungeon(key)
    {
        for (let dungeon of this.dungeons)
        {
            if (dungeon.key === key) return dungeon
        }
        return this.dungeons[0] // default to first
    }
    startPlayer(connection)
    {
        this.getDungeon(connection.key).startPlayer(connection.id)
    }
    addPlayer(connection)
    {
        let dungeon = this.getDungeon(connection.key)
        return dungeon.addPlayer(connection)
    }
    getPlayer(connection)
    {
        let dungeon = this.getDungeon(connection.key)
        if (!dungeon) return false
        return dungeon.getPlayer(connection.id)
    }
    getPlayerBySession(connection)
    {
        let dungeon = this.getDungeon(connection.key)
        return dungeon.getPlayerBySession(connection.session)
    }

    checkConnections()
    {
        for (let i = this.connections.length - 1; i >= 0; i--) {
            let connection = this.connections[i]
            let socket = connection.socket
            if (socket.readyState === socket.CLOSED) {
                // remove the socket 
                if (connection.type === 'spectator')
                    {
                        console.log('dead spectator')
                        let dungeon = this.getDungeon(connection.key)
                        dungeon.end()
                        this.connections.splice(i, 1)
                    }
            }
          }
    }
    getLevelData(connection)
    {
        let dungeon = this.getDungeon(connection.key)
        return dungeon.getLevelData(connection.id)
    }
    resetDungeons()
    {
        for (let i = this.dungeons.length - 1; i >= 0; i--)
        {
            if (this.dungeons[i].ended === true) 
            {
                console.log('REMOVING DUNGEON')
                this.dungeons.splice(i, 1)
            }
        }
        this.dungeons.forEach(dungeon => dungeon.reset())
    }
    updateView()
    {
        //console.log('updating view')
        for (let connection of this.connections)
        {
            if (connection.socket.readyState === connection.socket.OPEN)
            {
                // check if it's a controller
                //if (connection.type === 'controller') continue
                //console.log('connection: ', connection)
                let data = this.getViewPort(connection)
                //console.log(connection.player)
                if (data.type === 'game over' && connection.player !== null)
                {
                    //console.log('player: ', connection.player)
                    //console.log('connection: ', connection)
                    connection.player = null //dead, set for removal
                    console.log('sending end message')
                    connection.socket.send(JSON.stringify(data))
                }
                //if (connection.type !== 'spectator' && connection.player !== null)
                if (data.type !== 'game over' && data.type !== undefined)
                {
                    try 
                    {
                        connection.socket.send(JSON.stringify(data))
                    } catch (err)
                    {
                       console.log("error: ", err)
                       console.log(data) 
                    }
                }
            }
        }
        this.resetDungeons()
    }

    manageConnections(connection)
    {
        // TODO: Add a ban hammer for lingering connections to a dead game
        // there's no player
        console.log('new connection:', connection.key, connection.id)
        if (connection.id === 'spectator') 
        {
            this.connections.push(connection)
            return true
        }
        let dungeon = this.getDungeon(connection.key)
        let player = dungeon.getPlayer(connection.id)
        if (!player) return false // dead, or something
        //console.log('player: ', player)
        for (let con of this.connections)
            {
                //check empty connections
                if (con.player === null)
                    {
                    // same connection
                    if (con.socket === connection.socket) 
                        { // and same player, everything is fine
                        con.player = player
                        con.id = player.id
                        con.key = connection.key
                        //console.log('player: ', con.player)
                        return true
                    }
                }
            if (!con.player) continue
            if (con.player.id === connection.id) 
            {
            con.socket = connection.socket // set socket
            return true
            }
        }
        this.connections.push({socket: connection.socket, 
                                id: connection.id,
                                key: connection.key,
                                type: connection.type,
                                player})
        //console.log('connections: ', this.connections)
        return true
    }
    updateInput(input)
    {
        //console.log(input)
        let dungeon = this.getDungeon(input.key)
        dungeon.updateInput(input)
    }
    getViewPort(connection)
    {
        let dungeon = this.getDungeon(connection.key)
        //if (dungeon.key)
        if (connection.type === 'player' && dungeon.key !== connection.key)
            return {
                type: 'game over', 
                killer: 'the admins', 
                score: 'no points at all',
                name: 'some curious guy'}
        //console.log('dungeon: ', dungeon)
        return dungeon.getViewPort(connection)
    }
    update()
    {
        // console.log(this.dungeons)
        // for (let dungeon of this.dungeons)
        // {
        //     console.log(dungeon)
        //     dungeon.update()
        // }
        try 
        {
        this.dungeons.forEach(dungeon => dungeon.update())
        this.updateView()
        }
        catch (e)
        {
            console.error('ERROR: ', e)
        }
        this.ticks ++
    }
    createKey(len)
    {
        let key = generateKey(len)
        for (let dungeon of this.dungeons)
        {
            // try again
            if (dungeon.key === key) return this.createKey(len)
        }
        return key
    }
}