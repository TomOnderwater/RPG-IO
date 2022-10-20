function openStream() {
  print('connecting to:', wsPrefix + host)
    gamestream = new WebSocket(wsPrefix + host + '/gamestream')
    gamestream.onopen = () => {
      // now we are connected
      console.log('connected gamestream')
      gamestream.send(JSON.stringify({code: 'ready', key, id: game_id, type})) //send a ready
      gamestream.onmessage = (raw) => {
        let msg = JSON.parse(raw.data)
        switch(msg.type) 
        {
          case 'start':
            game_id = msg.id
            key = msg.key
            console.log("GAME START", game_id)
            console.log(msg.level)
            level.initLevel(msg.level)
            setGameState('game') //set state
          break
          case 'spectator':
            level.initLevel(msg.level)
            // set appropriate zoom level to display the level
            cam.updateZoom(width / level.width)
            cam.updateFocus({x: level.width * 0.5, y: level.height * 0.5}, 1)
            key = msg.key
            setGameState('spectator')
            break
          case 'update':
            updateView(msg.data)
          break
          case 'game over':
            console.log('GAME OVER')
            setGameState('game over')
            message = msg
          break
          case 'game id':
            game_id = msg.id
          break
        }
      }
    }
  }

function updateView(viewport)
{
  //print(leveldata)
  level.newData(viewport)

  if (viewport.leaderboard)
  leaderboard = viewport.leaderboard

  if (type == 'spectator') return
  player = level.getPlayer(game_id)
  
  if (viewport.feedback)
      handleFeedback(viewport.feedback)
  //console.log(viewport)
  if (viewport.inventory)
  {
    inventory = viewport.inventory
    //console.log('updating inventory')
    input.inventory.updateInventory()
  }
    
  //print(player, game_id, level.entities)
}

function sendInput(data)
{
  //console.log(data)
  gamestream.send(JSON.stringify({code: 'input', key, id: game_id, data, type}))
}

async function continueGame()
{
  setGameState('loading')
  const url = httpPrefix + host + '/continue'
  let response = await returnPost(url, {session: sess_id, id: activeID})
  if (response.id !== 'none')
  {
    console.log('still alive', response.id)
    game_id = response.id
    openStream()
  }
  else
  { // actually dead or removed
    activeID = 'none'
    setGameState('lobby')
  }
}

async function startSpectator()
{
  openStream()
}

async function loadLevelData(connection)
{
  const url = httpPrefix + host + '/getLevel'
  let data = await(returnPost(url, connection))
  console.log("got LEVEL: ", data)
  if (data.level) level.initLevel(data.level)
  cam.focus = createVector(level.width * 0.5, level.height * 0.5)
  cam.updateZoom(30, 1)
}

async function startGame(playername)
{
  //change the name
  let session = getCookie('rpg-io')
  inputname = playername
  setGameState('loading')
  const url = httpPrefix + host + '/start'
  //console.log('session:', session)
  let game = await returnPost(url, {session, name: inputname, key})
  print('game: ', game)
  if (game.id !== null)
  {
    print('my id:', game.id)
    game_id = game.id
    key = game.key
    if (gamestream)
    {
      if (gamestream.readyState)
        gamestream.send(JSON.stringify({code: 'ready', key, id: game_id, type})) //send a ready
      else
        openStream()
    }
    else openStream()
  }
}

async function registerSpectator()
{
  //
}
async function registerPlayer() {
  let session = getCookie('rpg-io')
  console.log('stored session', session)
  const url = httpPrefix + host + '/sess_id'
  let gamedetails = await returnPost(url, {session})
  if (gamedetails.account) 
  {
    console.log('server response:', gamedetails)
    let account = gamedetails.account
    activeID = gamedetails.id
    key = gamedetails.account.key
    console.log('key: ', key)
    if (account.session) 
    {
      setCookie('rpg-io', account.session, 7)
      sess_id = gamedetails.session
    }
    //)
    if (gamedetails.account) inputname = gamedetails.account.name
    setGameState('lobby')
  }
}

async function returnPost(url, data) {
  const body = JSON.stringify(data)
  console.log("data = ", body)
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'include', // include, *same-origin, omit
    body,
    headers: {
      'Content-Type': 'application/json',
      //'Access-Control-Allow-Origin': '192.168.178.48',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    }//,
    //body // body data type must match "Content-Type" header
  })
  if (response) return response.json()
  else return null
}