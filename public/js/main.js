p5.disableFriendlyErrors = true

//GAME SPECIFIC
let cam, level, player = false, sess_id, game_id, gamestate, inputname = 'gandalf', lobby,
  messageboard

let activeID = 'none' // if not none, means there's an existing player
//DEVICE SPECIFIC
let MOBILE, orientation, canvas

let inventoryType = 'boxes'

let key = ''

let ticks = 0

// VISUAL CONSTANTS
const entityborder = 0.03, TEXTUREBLEND = 0.05
const TXB2 = TEXTUREBLEND * 0.5

// DATA SPECIFIC
let input, gamestream, nameinput, message, keyinput, leaderboard, inventory, timer = 0

// RAW TEXTURES
let grasstex_, stonetex_, watertex_, sandtex_, dirttex_, graveltex_

// SCALED TEXTURES
let grassTexture, stoneTexture, waterTexture, sandTexture, dirtTexture, gravelTexture

let walltexture, woodicon, stoneicon, rocktexture, stonewallTexture, woodenwallTexture,
ammoicon, stafficon, gearicon, chestIcon, flailIcon

// FONTS
let titlefont

let textures = []

// SERVER SETTINGS
const host = location.host
const httpPrefix = isSecure() ? 'https://' : 'http://'
const wsPrefix = isSecure() ? 'wss://' : 'ws://'

const soundfolder = 'assets/sound_effects/'

// SHORTCUTS
let SEXYGREY // = color(51, 51, 51)

let sound


// QUERY STRING
const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
})

if (params.key) key = params.key

console.log('spectate key: ', spectate_key)

function preload()
{
  console.log('loading assets...')
  sound = new SoundManager()
  console.log('loading textures...')

  // SURFACE TEXTURES
  grasstex_ = loadImage('assets/textures/seamless_grass1.jpg')
  watertex_ = loadImage('assets/textures/watertexture1.jpg')
  stonetex_ = loadImage('assets/textures/stonetexture.jpg')
  dirttex_ = loadImage('assets/textures/dirt_texture1.jpg')
  sandtex_ = loadImage('assets/textures/sandtexture1.jpg')
  graveltex_ = loadImage('assets/textures/graveltexture.png')

  // STRUCTURE TEXTURES
  walltexture = loadImage('assets/textures/smallwalltexture.png')
  rocktexture = loadImage('assets/textures/rocktexture.png')
  woodenwallTexture = loadImage('assets/textures/woodwalltexture.jpg')
  stonewallTexture = loadImage('assets/textures/rockwall.jpg')

  // ICONS
  woodicon = loadImage('assets/textures/woodicon.png')
  stoneicon = loadImage('assets/textures/stoneicon.png')
  ammoicon = loadImage('assets/textures/ammobag.png')
  stafficon = loadImage('assets/textures/staff.png')
  chestIcon = loadImage('assets/textures/treasurechest.png')
  gearicon = loadImage('assets/textures/gearicon.png')
  flailIcon = loadImage('assets/textures/flailicon.png')

  // LOAD FONTS
  titlefont = loadFont('assets/fonts/GamePlayed-vYL7.ttf')

}

function setupInput()
{
  if (MOBILE) input = new MobileInput()
  else input = new PCInput() // prototype, not yet fully supported
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight)
  SEXYGREY = color(51, 51, 51)
  rumbletimer = millis()

  messageboard = new MessageBoard()

  resetTextures(100, TEXTUREBLEND)
  //sound.swoosh()
  cam = new Camera(createVector(0, 0), 20)

  level = new Level()

  setGameState('loading')

  MOBILE = isMobileDevice()

  sound.globalVolume(1)
  frameRate(60)

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
  //background(SEXYGREY)

  switch(gamestate)
  {
    case 'lobby':
    lobby.draw()
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
  handleRumble()
}
function setGameState(state)
{
  console.log("switching to", state)
  switch(state)
  {
    case 'lobby':
      lobby = new Lobby()
      gamestate = state

    // trigger music
    break
    case 'game':
    gamestate = state
    //sound.playMusic()
    break
    case 'loading':
    gamestate = state
    break
    case 'game over':
    gamestate = state
    sound.stopMusic()
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
  textFont(titlefont)
  text('GAME OVER', width * 0.5, height * 0.2)
  //console.log(message)
  let info = message.name + ' scored ' + message.score + ' points'
  let cause = 'before dying tragically'
  text(info, width * 0.5, height * 0.3)
  text(cause, width * 0.5, height * 0.4)
  pop()
  push()
  rectMode(CORNERS)
  fill(0, 255, 0, 100)
  rect(continueArea.x1, continueArea.y1, continueArea.x2, continueArea.y2, rounding)
  textSize(20)
  fill(255)
  textAlign(CENTER, CENTER)
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

class Lobby
{ constructor()
  {
    this.margin = 100 // for drawing label
    this.rounding = 10
    this.boxspacing = 70
    this.maxwidth = 300
    this.buttonwidth = 100

    nameinput = createInput(inputname)
    nameinput.style('font-size', '30px')
    nameinput.style('border-radius', '30px')
    nameinput.style('padding-left', '15px')
    nameinput.style('maxlength', '12')

    keyinput = createInput(key)
    keyinput.style('font-size', '30px')
    keyinput.style('border-radius', '30px')
    keyinput.style('padding-left', '15px')

    this.lastclick = {x: -10, y: -10}
  }
  handleClick(pos)
  {
    this.lastclick = pos
  }
  updateTouches()
  {
    for (let t of touches)
    {
      this.lastclick = t
    }
  }
  draw()
  {
  let focus = {x: level.width * 0.5, y: level.height * 0.5}
  cam.updateFocus(focus, 0.1)
  cam.updateZoom(30, 0.1)
  
  if (MOBILE) this.updateTouches()
  if (ticks % 3 == 0) // don't always render background
  {
    background(SEXYGREY)
    if (level.height !== undefined)
      level.draw()
  }

  let box = {x: this.margin, y: 50, w: width - this.margin * 2, h: 40}
  if (box.w > this.maxwidth)
  {
    box.w = this.maxwidth
    box.x = (width - this.maxwidth) * 0.5
  }

  //console.log(box)
  let s_area = {x1: width * 0.55, y1: box.y + this.boxspacing * 2, 
    x2: width * 0.55 + this.buttonwidth, y2: box.y + this.boxspacing * 2 + (this.buttonwidth * 0.8)}
  let continueArea = {x1: width * 0.45 - this.buttonwidth, 
    y1: box.y + this.boxspacing * 2, x2: width * 0.45, y2: box.y + this.boxspacing * 2 + (this.buttonwidth * 0.8)}

  nameinput.position(box.x, box.y)
  nameinput.size(box.w, box.h)

  keyinput.position(box.x, box.y + this.boxspacing)
  keyinput.size(box.w, box.h)

  push()
  textFont(titlefont)
  textAlign(CENTER, CENTER)
  textSize(width * 0.15)
  fill(51, 51, 51)
  text('MobFight', width * 0.5, height * 0.5)
  pop()


  push()
  noStroke()
  fill(255)
  rectMode(CORNERS)
  rect(s_area.x1, s_area.y1, s_area.x2, s_area.y2, this.rounding)
  stroke(0)
  fill(0)
  textAlign(RIGHT, CENTER)
  textSize(30)
  fill(255)
  text('name:', box.x - 10, box.y + (box.h / 2))
  text('key:', box.x - 10, box.y + this.boxspacing + (box.h * 0.5))
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
    rect(continueArea.x1, continueArea.y1, continueArea.x2, continueArea.y2, this.rounding)
    textAlign(CENTER, CENTER)
    textSize(24)
    fill(255)
    text('continue', (continueArea.x1 + continueArea.x2) * 0.5, (continueArea.y1 + continueArea.y2) * 0.5)
    pop()

    // TITLE

    if ((onField(this.lastclick, continueArea)))
    {
      continueGame()
      nameinput.hide()
      keyinput.hide()
    }
  }

  //check touch input on start button
    if (onField(this.lastclick, s_area))
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
  drawLeaderBoard({x: width - 20, y: 20}, RIGHT)
  messageboard.draw()
  //drawFrameRate({x: width -70, y: height - 20})
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
        if (player)
        {
          let focus = player.pos // player.pos.y}
          cam.updateFocus(focus, 0.2)
          if (player)
              cam.updateZoom(player.getZoom(), 0.05)
        }

        //level.checkTouches()
        level.update()
        level.draw()
    //player.draw()
      }
    }
  messageboard.draw()
  drawLeaderBoard({x: width - 15, y: 15}, RIGHT)
  input.draw()
  //drawFrameRate({x: width -70, y: height - 20})
}



