const express = require("express")
const app = express()
let path = require("path")

const config = require('./config.js')

// SET CONFIGURATION ////////////////////////////////////

let settings = config.deployment
process.argv.forEach(function (val, index) {
  let arguments = val.split('=')
  if (arguments.length > 1)
  {
    let argument = arguments[0]
    let value = arguments[1]
    if (argument == 'deployment') 
    {
      try 
      {
        settings = config[value]
      }
      catch (error)
      {
        settings = config.deployment
      }
    }
    if (argument == 'difficulty') settings.difficulty = value
    if (argument == 'port') settings.port = Number(settings.value)
  }
})

//const settings = config.deployment

const port = settings.port

const expressWS = require('express-ws')(app)
const bodyParser = require("body-parser")

const { exec } = require("child_process") // REMOVE FROM FLAWK BUILD

var dogsArr = []
app.use(bodyParser.json())

const GameMaster = require("./gamemaster.js")
const AccountManager = require("./accounts.js")

let gameMaster = new GameMaster(settings)

if (settings.reset) resetGames()

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

app.post('/getTitle', (req, res) => {
  res.send({title: settings.title})
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


// add security to git hook
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

app.post("/getip", (req, res) => 
{
  res.send({ip: gameMaster.getIP({key: req.key, id: req.id})})
})

app.post("/start", (req, res) => {
  //console.log(req)
  // contains a key
  let connection = req.body
  connection.key = connection.key.toLowerCase()
  //console.log('start', connection.name, 'in level:', connection.key)
  let game = gameMaster.addPlayer(connection)
  accountmanager.updateName(connection.session, connection.name) //update latest name
  accountmanager.updateKey(connection.session, connection.key)
  res.send(game)
})

// TODO add method to establish round trip ping

app.post("/sess_id", (req, res) => {
  let connection = req.body
  //console.log('session: ', connection.session)
  //check if the account is alive
  let player = gameMaster.getPlayerBySession(connection)
  //console.log('active player:', player)
  let id = 'none'
  if (player) id = player.id
  // get account details
  let account = accountmanager.getAccount(connection.session)
  //console.log('account: ', account)
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

function resetGames()
{
  console.log("CLOSING SOCKET CONNECTIONS")
  gameMaster.cleanup()
  // reset gamemaster
  console.log("RESETTING GAME HANDLER")
  gameMaster = new GameMaster(settings)
  console.log("next cleanup scheduled", settings.reset * 0.001, 'seconds from now')
  setTimeout(resetGames, settings.reset)
}

function runGames()
{
  gameMaster.update()
  //console.log('update')
  setTimeout(runGames, TICKRATE) /// UPDATE FREQUENCY OF THE GAME
}
// identification is done via game id
app.ws('/gamestream', (ws, req) => {
  
  // get the ip address
  let ipfull = req.socket.remoteAddress
  let fields = ipfull.split(':')
  let ip = fields[fields.length -1]

  ws.onmessage = (body) => 
  {
    let msg = JSON.parse(body.data)

    //get the key of the message
    let key = msg.key
    let id = msg.id
    let type = msg.type

    switch(msg.code) 
    {
      case 'input':
        gameMaster.updateInput(msg)
      break
      case 'ready':
        if (type === 'spectator')
          {
            // check if the key is an existing dungeon
            //console.log(key)
            let game = gameMaster.getDungeon(key)
            if (game.key !== key) game = gameMaster.addDungeon(key)
            key = game.key
            id = 'spectator'
            if (gameMaster.manageConnections({socket: ws, key, id, type}))
            { // socket is assigned to a dungeon / player
              ws.send(JSON.stringify({type: 'spectator', key, 
                level: gameMaster.getLevelData({key, id, type})}))
            }
              break
          }
        // check if the player is still alive
        gameMaster.startPlayer({key, id, type})
        if (gameMaster.manageConnections({socket: ws, key, id, type, ip}))
        {
          console.log('ip: ', ip)
          ws.send(JSON.stringify({
            type: 'start', id, key, 
            level: gameMaster.getLevelData({key, id, type})
            }))
        }
        break
        case 'level':
          ws.send(JSON.stringify({type: 'view', 
          level: gameMaster.getLevelData({key, id, type})}))
      default:
      //do nothing
      break
    }
  }
})




