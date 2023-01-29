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
    constructor(settings)
    {
        this.dungeons = []
        // TODO add function to get ip address from connections.socket
        this.basesize = {width: 32, height: 18}
        // TODO add ping to handshake
        this.connections = [] // TODO: add ping to connections
        this.ticks = 0
        this.settings = settings || {}
        this.difficulty = this.settings.difficulty ? this.settings.difficulty : 'easy'
        console.log('base difficulty:', this.difficulty)

        if (!settings.basedungeons)
            settings.basedungeons = [{key: 'arena', type: 'arena', difficulty: 'easy'}]
        
        settings.basedungeons.forEach(dungeon => {
            let configsettings = dungeon
            if (!configsettings.key) configsettings.key = this.createKey(5)
            if (!configsettings.size) configsettings.size = this.basesize
            if (!configsettings.mode) configsettings.mode = 'arena'
            if (!configsettings.difficulty) configsettings.difficulty = this.difficulty
            configsettings.persistent = true
            
            this.dungeons.push(new Dungeon(configsettings, configsettings.key))
        })
    }
    addDungeon(key)
    {
        if (key === "" || this.duplicateKey(key)) key = this.createKey(5)
        console.log('key = ', key)
        let dungeon = new Dungeon({
            floorcount: 1, 
            size: this.basesize, 
            mode: 'arena'}, 
            key)

        this.dungeons.push(dungeon)
        console.log('dungeons: ', this.dungeons)
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
                // get the active dungeon
                let dungeon = this.getDungeon(connection.key)
                if (connection.type === 'spectator')
                    {
                        // check if there's multiple spectators on the dungeon
                        let last = true
                        for (let j = 0; j < this.connections.length; j++)
                        {
                            if (j !== i && this.connections[j].key === dungeon.key)
                            {
                                last = false
                                break
                            }
                        }
                        if (last && !dungeon.persistent) dungeon.end() // end the dungeon if last spectator
                        this.connections.splice(i, 1)
                    }
                else 
                {
                    let player = this.getPlayer(connection)
                    //console.log('connection:', connection)
                    if (!player || player.dead()) {
                        //console.log('player is dead', player, connection.id)
                        dungeon.handlePlayerDisconnection(connection.id)
                        this.connections.splice(i, 1)
                    }
                }
            }
            else if (this.connections[i].player)
            {
                if (this.connections[i].player.dead())
                    this.connections[i].player = null
            }
          }
    }
    cleanup()
    {
        for (let connection of this.connections)
        {
            connection.socket.close("cleanup")
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
                let data = this.getViewPort(connection)
                //console.log(connection.player)
                if (!data) continue
                if (data.type === 'game over' && connection.player !== null)
                {
                    connection.player = null //dead, set for removal
                    //console.log('sending end message', data)
                    connection.socket.send(JSON.stringify(data))
                }
                //if (connection.type !== 'spectator' && connection.player !== null)
                if (data.type !== 'game over' && data.type !== undefined)
                {
                    try 
                    {
                        let msg = JSON.stringify(data)
                        //console.log('package size (kB):', msg.length / 1024)
                        connection.socket.send(msg)
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
        //console.log('new connection:', connection.key, connection.id)
        if (connection.id === 'spectator') 
        {
            this.connections.push(connection)
            return true
        }
        let dungeon = this.getDungeon(connection.key)
        let player = dungeon.getPlayer(connection.id)
        if (player === null) return false // dead, or something
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
                        con.ip === connection.ip
                        //console.log('player: ', con.player)
                        return true
                    }
                }
            if (!con.player) continue
            if (con.player.id === connection.id) 
            {
            return true
            }
        }
        this.connections.push({socket: connection.socket, 
                                id: connection.id,
                                key: connection.key,
                                type: connection.type,
                                ip: connection.ip,
                                player})
        //console.log('connections: ', this.connections)
        return true
    }
    getIP(connection) //returns the ip address based on the id and key
    {
        for (let con of this.connections)
        {
            if (con.key === connection.key && con.id === connection.id)
                return connection.ip
        }
    }
    updateInput(input)
    {
        // TODO SPEED UP FUNCTION BY ASSIGNING PLAYER TO CONNECTION
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
        let viewport = dungeon.getViewPort(connection)
        if (dungeon.broadcast)
            viewport.data.broadcast = dungeon.broadcast
        if (dungeon.fullnew) 
            viewport.data.level = dungeon.getLevelData(connection.id)
        return viewport
    }
    update()
    {
        try 
        {
        this.dungeons.forEach(dungeon => dungeon.update(this.connections))
        this.updateView()
        }
        catch (e)
        {
            console.error('ERROR: ', e)
            // remove the problem, or reset the game master if persistent error

        }
        this.ticks ++
    }
    duplicateKey(key)
    {
        for (let dungeon of this.dungeons)
        {
            if (key === dungeon.key) return true
        }
        return false
    }
    createKey(len)
    {
        let key = generateKey(len)
        if (this.duplicateKey(key)) return this.createKey(len)
        return key
    }
}