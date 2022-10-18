const express = require("express")
const app = express()
let path = require("path")
const port = 3000

const expressWS = require('express-ws')(app)
const bodyParser = require("body-parser")

const { exec } = require("child_process")

var dogsArr = []
app.use(bodyParser.json())

const GameMaster = require("./gamemaster.js")
const AccountManager = require("./accounts.js")

const gameMaster = new GameMaster()

//const dungeon = new Dungeon(1) // floor count

runGames()
checkConnections()

let accountmanager = new AccountManager()

app.use(express.static("public"))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"))
})

// MONITOR INTEGRATION
app.get("/monitor", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/monitor.html"))
})

app.get("/controller", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/controller.html"))
})

// TESTING
app.get("/testing", (req, res) => {
    res.sendFile(path.join(__dirname + "/public/testing.html"))
})

app.post("/getLevel", (req, res) => {
  let connection = req.body
  let level = gameMaster.getLevelData(connection)
  res.send({level})
})

app.post("/continue", (req, res) => {
  let data = req.body
  let id = 'none'
  let player = gameMaster.getPlayer(data)
  if (player) id = player.id
  res.send({id})
})


// signature = 'whatgameisthisbad?'
app.post("/newcode", (req, res) =>
{
  exec("git pull", (error, stdout, stderr) =>
  {
    if (error) 
    {
      console.log(`error: ${error.message}`)
      return
    } if (stderr)
    {
      console.log(`stderr: ${stderr}`)
        return
    }
    console.log(`stdout: ${stdout}`)
  })
})

app.post("/start", (req, res) => {
  //console.log(req)
  // contains a key
  let connection = req.body
  connection.key = connection.key.toLowerCase()
  console.log('start', connection.name, 'in dungeon: ', connection.key)
  let game = gameMaster.addPlayer(connection)
  accountmanager.updateName(connection.session, connection.name) //update latest name
  accountmanager.updateKey(connection.session, connection.key)
  res.send(game)
})

app.post("/sess_id", (req, res) => {
  let connection = req.body
  console.log('session: ', connection.session)
  //check if the account is alive
  let player = gameMaster.getPlayerBySession(connection)
  console.log('active player:', player)
  let id = 'none'
  if (player) id = player.id
  // get account details
  let account = accountmanager.getAccount(connection.session)
  console.log('account: ', account)
  res.send({id, account})
})

const server = app.listen(port, () => {
  console.log(`rpg-io listening at http://localhost:${port}`)
})

function checkConnections()
{
  gameMaster.checkConnections()
  setTimeout(checkConnections, 1000)
}
function runGames()
{
  gameMaster.update()
  //console.log('update')
  setTimeout(runGames, 34) /// UPDATE FREQUENCY OF THE GAME
}
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

    //get the key of the message
    let key = msg.key
    let id = msg.id
    let type = msg.type

    //console.log(msg)
    let connection = {socket: ws, key, id, type}
    switch(msg.code) 
    {
      case 'input':
        gameMaster.updateInput(msg)
        // console.log(viewport)
        //ws.send(viewport)
      break
      case 'ready':
        if (type === 'spectator')
          {
            let game = gameMaster.addDungeon()
            connection.key = game.key
            connection.id = 'spectator'
            if (gameMaster.manageConnections(connection))
            {
              //console.log('connection:', connection)
              //console.log(gameMaster.getLevelData(connection).width)
              ws.send(JSON.stringify({type: 'spectator',
                key: connection.key, 
                level: gameMaster.getLevelData(connection)}))
            }
              break
          }
        gameMaster.startPlayer(connection)
        // check if the player is still alive
        if (gameMaster.manageConnections(connection)) 
          ws.send(JSON.stringify({
            type: 'start', 
            id: connection.id, key: connection.key, 
            level: gameMaster.getLevelData(connection)
            }))
        break
        case 'level':
          ws.send(JSON.stringify({type: 'view', 
          level: gameMaster.getLevelData(connection)}))
      default:
      //do nothing
      break
    }
  }
})




