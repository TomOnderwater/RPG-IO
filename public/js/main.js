//GAME SPECIFIC
let cam, level, player = false, sess_id, game_id, gamestate, inputname = 'gandalf', myitems = []

let activeID = 'none' // if not none, means there's an existing player
//DEVICE SPECIFIC
let MOBILE, orientation, canvas

let key = ''

// DATA SPECIFIC
let input, gamestream, nameinput, message, keyinput

// TEXTURES
let walltexture

// SERVER SETTINGS
const host = location.host
const httpPrefix = isSecure() ? 'https://' : 'http://'
const wsPrefix = isSecure() ? 'wss://' : 'ws://'

// SHORTCUTS
let SEXYGREY // = color(51, 51, 51)

//let sound

function setupInput()
{
  if (MOBILE) input = new MobileInput()
}

function preload()
{
  walltexture = loadImage('assets/textures/walltexture.png')
  //console.log('loading sounds')
  //sound = new Sound()
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight)
  SEXYGREY = color(51, 51, 51)
  //sound.swoosh()
  cam = new Camera(createVector(0, 0), 20)

  level = new Level()

  setGameState('loading')

  loadLevelData({key, id: 'spectator', type: 'spectator'})

  MOBILE = isMobileDevice()

  console.log('type:', type)
  //register player
  if (type === 'player' || type === 'controller') 
  {
    setupInput()
    registerPlayer()
  }
  if (type === 'spectator') startSpectator()
  }

function draw() 
{
  //blank grey
  push()
  background(SEXYGREY)
  pop()

  switch(gamestate)
  {
    case 'lobby':
    lobby()
    break
    case 'game':
    updateInput()
    input.update()
    drawGame()
    break
    case 'game over':
    drawGameOver()
    break
    case 'spectator':
      drawSpectator()
    break
    default:
    //eg loading
    break
  }
  if (!fullscreen()) drawFullscreen()
}

function updateInput()
{
  sendInput(input.update())
}
function setGameState(state)
{
  console.log("switching to", state)
  switch(state)
  {
    case 'lobby':
    nameinput = createInput(inputname)
    nameinput.style('font-size', '30px')

    keyinput = createInput(key)
    keyinput.style('font-size', '30px')
    gamestate = state
    break
    case 'game':
    gamestate = state
    break
    case 'loading':
    gamestate = state
    break
    case 'game over':
    gamestate = state
    break
    case 'spectator':
      gamestate = state
    break
    default:
    print(state, 'is not a recognized gamestate')
    break
  }
}

function drawGameOver()
{
  let continueArea = {x1: width * 0.5 - 100, y1: height * 0.5, x2: width * 0.5 + 100, y2: height * 0.7}
  const rounding = 10
  push()
  fill(255)
  textSize(30)
  textAlign(CENTER, CENTER)
  text(message.type, width * 0.5, height * 0.2)
  //console.log(message)
  let info = message.name + ' scored ' + message.score.score + ' points'
  let cause = 'before dying'
  if (message.killer == 'natural causes') cause += ' of natural causes'
  else cause += (' by ' + message.killer)
  text(info, width * 0.5, height * 0.3)
  text(cause, width * 0.5, height * 0.4)

  rectMode(CORNERS)
  fill(0, 255, 0, 100)
  rect(continueArea.x1, continueArea.y1, continueArea.x2, continueArea.y2, rounding)
  textSize(20)
  fill(255)
  text('continue', width * 0.5, height * 0.6)
  pop()
  for (let t of touches)
    {
    if (onField(t, continueArea))
      {
        game_id = 'none'
        setGameState('lobby')
      }
    }
}

function lobby()
{
  const margin = 100
  const rounding = 10
  const minwidth = 120
  // draw the level
  let focus = {x: level.width * 0.5, y: level.height * 0.5}
  cam.updateFocus(focus, 0.1)
  cam.updateZoom(30, 0.1)
  //cam.updateZoom(20)

  level.update()
  level.draw()

  let box = {x: margin * 2, y: margin, w: width - (margin * 4), h: 60}
  let s_area = {x1: box.x + box.w + 20, y1: box.y, x2: box.x + box.w + 150, y2: box.y + box.h + 5}
  if (box.w < minwidth)
  { //force wider
    box.x -= (minwidth - box.w)
    box.w += (minwidth - box.w)
  }
  let continueArea = {x1: s_area.x1, y1: s_area.y1 + 100, x2: s_area.x2, y2: s_area.y2 + 100}

  nameinput.position(box.x, box.y)
  nameinput.size(box.w, box.h)

  keyinput.position(box.x, box.y + 100)
  keyinput.size(box.w, box.h)
  push()
  noStroke()
  fill(255, 100)
  rectMode(CORNERS)
  rect(s_area.x1, s_area.y1, s_area.x2, s_area.y2, rounding)
  stroke(0)
  fill(0)
  textAlign(RIGHT, CENTER)
  textSize(30)
  fill(255)
  text('name:', box.x - 10, box.y + (box.h / 2))
  text('key:', box.x - 10, box.y + 100 + (box.h * 0.5))
  textAlign(CENTER, CENTER)
  fill(0)
  text('start', (s_area.x1 + s_area.x2) / 2, (s_area.y1 + s_area.y2) / 2)
  pop()

  if (activeID != 'none')
  { // active game, you can try to join
    push()
    stroke(0)
    rectMode(CORNERS)
    fill(0, 255, 0, 100)
    rect(continueArea.x1, continueArea.y1, continueArea.x2, continueArea.y2, rounding)
    textAlign(CENTER, CENTER)
    textSize(24)
    fill(255)
    text('continue', (continueArea.x1 + continueArea.x2) * 0.5, (continueArea.y1 + continueArea.y2) * 0.5)
    pop()
    for (let t of touches)
    {
    if (onField(t, continueArea))
      {
        continueGame()
        nameinput.hide()
      }
    }
  }

  //check touch input on start button
  for (let t of touches)
  {
    if (onField(t, s_area))
    {
      key = keyinput.value()
      startGame(nameinput.value())
      keyinput.hide()
      nameinput.hide()
    }
  }
}

function drawSpectator()
{
  let focus = {x: level.width * 0.5, y: level.height * 0.5}
  cam.updateFocus(focus, 0.1)
  //cam.updateZoom(20)

  level.update()
  level.draw()
  push()
  fill(255)
  noStroke()
  textSize(30)
  textAlign(TOP, LEFT)
  text(host + " key: " + key, 10, 30)
  pop()
}
function drawGame()
{

    if (type === 'player')
    {
       // draw order -> tiles, entities
   if (player != null) // check if there's something to draw
    {
    let jump = height / (cam.zoom * 8)
    if (player)
    {
      let focus = {x: player.pos.x, y: input.inventory.open ? player.pos.y + jump : player.pos.y}
      cam.updateFocus(focus, 0.1)
      cam.updateZoom(player.getZoom(), 0.05)
    }

    level.checkTouches()

    level.update()

    level.draw()
    //player.draw()
  }
    }

  input.draw()
}



