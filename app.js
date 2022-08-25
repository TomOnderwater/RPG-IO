const express = require("express")
const app = express()
let path = require("path")
const port = 3000

const expressWS = require('express-ws')(app)
const bodyParser = require("body-parser")

let connections = [] //websocket clients

var dogsArr = []
app.use(bodyParser.json())

const Dungeon = require("./game/dungeon.js")
const AccountManager = require("./accounts.js")

const dungeon = new Dungeon(1) // floor count

let connectioncount = 0

runGames()

checkConnections()

let accountmanager = new AccountManager()

app.use(express.static("public"))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
})

app.get("/testing", (req, res) => {
    res.sendFile(path.join(__dirname + "/public/testing.html"));
})

app.post("/continue", (req, res) => {
  let data = req.body
  let id = 'none'
  let player = dungeon.getPlayer(data.id)
  if (player) id = player.id
  res.send({id})
})

app.post("/start", (req, res) => {
  //console.log(req)
  let player = req.body
  console.log('start', player)
  let id = dungeon.addPlayer(player)
  accountmanager.updateName(player.session, player.name) //update latest name
  res.send({id})
})

app.post("/sess_id", (req, res) => {
  let session = req.body.session
  console.log('session: ', session)
  //check if the account is alive
  let player = dungeon.getPlayerBySession(session)
  console.log('active player:', player)
  let id = 'none'
  if (player) id = player.id
  // get account details
  let account = accountmanager.getAccount(session)
  console.log('account: ', account)
  res.send({id, account})
})

const server = app.listen(port, () => {
  console.log(`rpg-io listening at http://localhost:${port}`)
})

// identification is done via game id
app.ws('/gamestream', (ws, req) => {
  //console.log('new client connected', ws)
  // get player
  //console.log('data: ', req.body)
  //let player = dungeon.getPlayer()
  //clients.push(new Connection(ws, ))
  ws.onmessage = (body) => 
  {
    let msg = JSON.parse(body.data)
    //console.log(msg)
    switch(msg.type) 
    {
      case 'input':
        dungeon.updateInput(msg.id, msg.data)
        //console.log(viewport)
        //ws.send(viewport)
      break
      case 'ready':
        dungeon.startPlayer(msg.id)
        if (manageConnections(ws, msg.id)) ws.send(JSON.stringify({
          type: 'start', 
          id: msg.id, 
          level: dungeon.getLevelData(msg.id)
          }))
      default:
      //do nothing
      break
    }
  }
})

function updateView()
{
  connections.forEach(connection => {
    if (connection.socket.readyState === connection.socket.OPEN)
    {
        // check if there's a player
        if (connection.player === null)
          return
        let data = dungeon.getViewport(connection.player.id)
        if (data.type == 'game over')
          connection.player = null
        connection.socket.send(JSON.stringify(data))
        //else, player is dead or something
    }
  })
  dungeon.resetEvents()
}

function connectionID()
{
  return connectioncount ++
}

class Connection {
  constructor(socket, player)
  {
    this.socket = socket
    this.player = player
  }
}

function manageConnections(socket, id)
{
  let player = dungeon.getPlayer(id)
  if (!player) return false // weird, there's no player
  // check if there's a connection with an empty player
  // check if there's already a connection, if so, overwrite it
  for (let connection of connections)
  {
    if (connection.player === null)
    {
      if (connection.socket === socket) 
      {
        connection.player = player
        return true
      }
    }
    if (!connection.player) continue
    if (connection.player.id === id) 
    {
      connection.socket = socket // set socket
      return true
    }
  }
  connections.push(new Connection(socket, player))
  return true
}

function checkConnections() 
{
  for (let i = connections.length - 1; i >= 0; i--) {
    let socket = connections[i].socket
    if (socket.readyState === socket.CLOSED) {
      //console.log('client time-out detected', connections[i].player.name)
      //remove from game and connections
      //clients.splice(i, 1)
    }
  }
  setTimeout(checkConnections, 1000)
}

function runGames() {
  dungeon.update()
  if (dungeon.ticks % 2 === 0) updateView() // once every frame
  //updateView() //always
  //updateClientView(dungeon.getGameData()) //or something like that
  setTimeout(runGames, 34) //30 hz
}
