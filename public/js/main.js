p5.disableFriendlyErrors = true

//GAME SPECIFIC
let cam, level, player = false, sess_id, game_id, gamestate, inputname = 'gandalf', myitems = []

let activeID = 'none' // if not none, means there's an existing player
//DEVICE SPECIFIC
let MOBILE, orientation, canvas

let key = ''

let ticks = 0

// VISUAL CONSTANTS
const entityborder = 0.03

// DATA SPECIFIC
let input, gamestream, nameinput, message, keyinput, leaderboard, inventory, timer = 0

// TEXTURES
let walltexture, woodicon, stoneicon, rocktexture, 
grassTexture, stoneTexture, waterTexture, sandTexture,
dirtTexture, gravelTexture, stonewallTexture, woodenwallTexture,
ammoicon, stafficon

let textures = []

// SERVER SETTINGS
const host = location.host
const httpPrefix = isSecure() ? 'https://' : 'http://'
const wsPrefix = isSecure() ? 'wss://' : 'ws://'

// SHORTCUTS
let SEXYGREY // = color(51, 51, 51)

let sound

function setupInput()
{
  if (MOBILE) input = new MobileInput()
  else input = new PCInput() // prototype, not yet fully supported
}

function preload()
{
  walltexture = loadImage('assets/textures/smallwalltexture.png')
  woodicon = loadImage('assets/textures/woodicon.png')
  stoneicon = loadImage('assets/textures/stoneicon.png')
  rocktexture = loadImage('assets/textures/rocktexture.png')
  grassTexture = loadImage('assets/textures/seamless_grass1.jpg')
  waterTexture = loadImage('assets/textures/watertexture1.jpg')
  stoneTexture = loadImage('assets/textures/stonetexture.jpg')
  dirtTexture = loadImage('assets/textures/dirt_texture1.jpg')
  sandTexture = loadImage('assets/textures/sandtexture1.jpg')
  gravelTexture = loadImage('assets/textures/gravel_texture1.jpg')
  woodenwallTexture = loadImage('assets/textures/woodwalltexture.jpg')
  stonewallTexture = loadImage('assets/textures/rockwall.jpg')
  ammoicon = loadImage('assets/textures/ammobag.png')
  stafficon = loadImage('assets/textures/staff.png')
  
  //sound = new Sound()
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight)
  SEXYGREY = color(51, 51, 51)

  //sound.swoosh()
  cam = new Camera(createVector(0, 0), 20)

  blendTextures()

  level = new Level()

  setGameState('loading')

  MOBILE = isMobileDevice()

  // setFrameRate(30) //frame updates at 30 hz
  console.log('connection type:', type)
  //register player
  if (type === 'player' || type === 'controller') 
  {
    loadLevelData({key, id: 'spectator', type: 'spectator'})
    setupInput()
    registerPlayer()
  }
  if (type === 'spectator') startSpectator()
  }

  // update loop
function draw() 
{
  //blank grey

  switch(gamestate)
  {
    case 'lobby':
    lobby()
    break
    case 'game':
    // time output:
    if (millis() > timer + 34)
    {
      timer = millis()
      updateInput()
    }
    //input.update()
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
    background(SEXYGREY)
    break
  }
  //fullscreen()
  ticks ++
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
    nameinput.style('border-radius', '30px')
    nameinput.style('padding-left', '15px')
    nameinput.style('maxlength', '12')

    keyinput = createInput(key)
    keyinput.style('font-size', '30px')
    keyinput.style('border-radius', '30px')
    keyinput.style('padding-left', '15px')
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
  const margin = 100 // for drawing label
  const rounding = 10
  const boxspacing = 70
  // draw the level
  let focus = {x: level.width * 0.5, y: level.height * 0.5}
  cam.updateFocus(focus, 0.1)
  cam.updateZoom(30, 0.1)
  
  if (ticks % 3 == 0) 
  {
    background(SEXYGREY)
    if (level.height !== undefined)
      level.draw()
  }

  let box = {x: margin, y: 50, w: width - margin * 2, h: 40}
  let s_area = {x1: width * 0.55, y1: box.y + boxspacing * 2, x2: width * 0.85, y2: box.y + boxspacing * 3}
  let continueArea = {x1: width * 0.15, y1: box.y + boxspacing * 2, x2: width * 0.45, y2: box.y + boxspacing * 3}

  nameinput.position(box.x, box.y)
  nameinput.size(box.w, box.h)

  keyinput.position(box.x, box.y + boxspacing)
  keyinput.size(box.w, box.h)
  push()
  noStroke()
  fill(255)
  rectMode(CORNERS)
  rect(s_area.x1, s_area.y1, s_area.x2, s_area.y2, rounding)
  stroke(0)
  fill(0)
  textAlign(RIGHT, CENTER)
  textSize(30)
  fill(255)
  text('name:', box.x - 10, box.y + (box.h / 2))
  text('key:', box.x - 10, box.y + boxspacing + (box.h * 0.5))
  textAlign(CENTER, CENTER)
  fill(0)
  text('start', (s_area.x1 + s_area.x2) / 2, (s_area.y1 + s_area.y2) / 2)
  pop()

  if (activeID != 'none')
  { // active game, you can try to join
    push()
    stroke(0)
    rectMode(CORNERS)
    fill(0, 255, 0)
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
        keyinput.hide()
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
  //console.log('drawing spectator', cam)
  let focus = {x: level.width * 0.5, y: level.height * 0.5}
  //console.log(focus, level.width, level.height)
  cam.updateFocus(focus, 0.1)
  cam.zoomToLevel(level)
  //cam.updateZoom(20)
  background(SEXYGREY)
  level.update()
  level.draw()
  push()
  fill(255)
  noStroke()
  textSize(30)
  textAlign(TOP, LEFT)
  text("go to: " + httpPrefix + host + " and connect with key: " + key, 10, 30)
  drawLeaderBoard({x: 5, y: 60})
  drawFrameRate({x: width -70, y: height - 20})
  pop()
}
function drawGame()
{
  background(SEXYGREY)
    if (type === 'player')
    {
       // draw order -> tiles, entities
      if (player != null) // check if there's something to draw
        {
        let jump = height / (cam.zoom * 8)
        if (player)
        {
          let focus = player.pos // player.pos.y}
          cam.updateFocus(focus, 0.2)
          if (player)
              cam.updateZoom(player.getZoom(), 0.05)
        }
        level.checkTouches()
        level.update()
        level.draw()
    //player.draw()
      }
    }

  drawLeaderBoard({x: 5, y: 15})
  input.draw()
  drawFrameRate({x: width -70, y: height - 20})
}



