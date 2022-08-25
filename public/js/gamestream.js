function openStream() {
  print('connecting to:', wsPrefix + host)
    gamestream = new WebSocket(wsPrefix + host + '/gamestream')
    gamestream.onopen = () => {
      // now we are connected
      console.log('connected gamestream')
      gamestream.send(JSON.stringify({type: 'ready', id: game_id})) //send a ready
      gamestream.onmessage = (raw) => {
        let msg = JSON.parse(raw.data)
        switch(msg.type) 
        {
          case 'start':
            game_id = msg.id
            console.log("GAME START", game_id)
            console.log(msg.level)
            level.initLevel(msg.level)
            setGameState('game') //set state
          break
          case 'update':
            updateView(msg.data)
          break
          case 'game over':
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
  player = level.getPlayer(game_id)
  if (viewport.perception)
      {
        //console.log(viewport.perception)
        if (player) player.updatePerception(viewport.perception)
      }
  //console.log(viewport)
  if (viewport.inventory) 
    input.inventory.updateInventory(viewport.inventory)
  //print(player, game_id, level.entities)
}

function sendInput(data)
{
  //console.log(data)
  gamestream.send(JSON.stringify({type: 'input', id: game_id, data}))
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
async function startGame(playername)
{
  //change the name
  let session = getCookie('rpg-io')
  inputname = playername
  setGameState('loading')
  const url = httpPrefix + host + '/start'
  //console.log('session:', session)
  let game = await returnPost(url, {session, name: inputname})
  print(game)
  if (game.id !== null)
  {
    print('my id:', game.id)
    game_id = game.id
    if (gamestream)
    {
      if (gamestream.readyState)
        gamestream.send(JSON.stringify({type: 'ready', id: game_id})) //send a ready
      else
        openStream()
    }
    else openStream()
  }
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
    if (account.session) 
    {
      setCookie('rpg-io', account.session, 7)
      sess_id = gamedetails.session
    }
    if (gamedetails.name) inputname = gamedetails.name
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