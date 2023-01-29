
function isAbout(a, b, tolerance)
{
    return (a > b - tolerance && a < b + tolerance)
}

function getRelativeAngle(a, b) {
    return (((a + b) % TWO_PI) + TWO_PI) % TWO_PI
}

function bounce(p, t, bounce)
{
  return {x: p.x + ((t.x - p.x) * bounce), y: p.y + ((t.y - p.y) * bounce)}
}

let vibration = 0, lastvibration = rumbletimer = 0

function rumble(duration)
{
  if (!window.navigator.vibrate) return
  if (millis() > rumbletimer + lastvibration)
  {
    rumbletimer = millis()
    vibration += duration
  }
}

function handleRumble()
{
  if (!window.navigator.vibrate) return
  if (vibration > 0) 
  {
    rumbletimer = millis()
    lastvibration = vibration
    window.navigator.vibrate(vibration)
    vibration = 0
  }
}

function resetTextures(zoom, blending)
{
  grassTexture = createTexture(grasstex_, zoom, blending)
  dirtTexture = createTexture(dirttex_, zoom, blending)
  stoneTexture = createTexture(stonetex_, zoom, blending)
  waterTexture = createTexture(watertex_, zoom, blending)
  gravelTexture = createTexture(graveltex_, zoom, blending)
  sandTexture = createTexture(sandtex_, zoom, blending)
}

function handleFeedback(feedback)
{
 if (type === 'spectator') return
  for (let event of feedback)
  {
    //console.log(event)
    switch(event.type)
    {
      case 'prime':
        rumble(30)
      break
      case 'bowshot':
        if (event.owner === game_id) rumble(15)
      break
      case 'fireball':
        if (event.owner === game_id) rumble(15)
      break
      case 'damage':
        //console.log('damage')
          if (event.target.id === game_id)
          {
            //if (event.target.id === game_id)
              rumble(event.damage * 2)
          }
          if (event.owner === game_id) 
            rumble(event.damage)
      break
      case 'explosion':
        //console.log('explosion', event.cost)
        if (event.owner === game_id) rumble(25 + event.cost * 25)
      break

    }
  }
}
function posAngle(angle)
{
     return (Math.PI * 2 + (angle % (Math.PI * 2))) % (Math.PI * 2)
}

function drawFrameRate(pos)
{
  push()
  fill(255)
  textSize(16)
  text('fps: ' + round(getFrameRate()), pos.x, pos.y)
  pop()
}

function drawIcon(icon, pos, size, rot)
{
  push()
  translate(pos.x, pos.y)
  rotate(rot || 0)
  imageMode(CENTER)
  image(icon, 0, 0, size, size)
  pop()
}

function drawItem(type, pos, size, _rot)
{
  let rot = _rot || 0
  let emoji = ''
  switch (type)
  {
    case SWORD:
      emoji = '🗡️'
      break
    case BOW:
      emoji = '🏹'
      break
    case NONE:
      emoji = '✊'
      break
    case WOOD:
      drawIcon(woodicon, pos, size, rot)
      return
    case ROCK:
      drawIcon(stoneicon, pos, size, rot)
      return
    case AMMO:
      drawIcon(ammoicon, pos, size, rot)
      return
    case STAFF:
      drawIcon(stafficon, pos, size, rot)
      return
    case FLAIL:
      drawIcon(flailIcon, pos, size, rot)
      return
    case POTION:
      drawIcon(potionicon, pos, size, rot)
      return
    default:
      emoji = '✊'
      break
    }
  push()
  translate(pos.x, pos.y)
  rotate(rot)
  textAlign(CENTER, CENTER)
  textSize(size)
  text(emoji, 0, 0)
  pop()
}

class MessageBoard
{
  constructor()
  {
      this.count = 0
      this.counting = false
  }
  countdown(count)
  {
      this.count = count
      this.counting = true
  }
  stopCountdown()
  {
    this.counting = false
  }
  draw()
  {
    if (!this.counting) return
    push()
    textFont(titlefont)
    textAlign(CENTER, CENTER)
    let size = width * 0.05
    if (size > 40) size = 40
    textSize(size)
    fill(255)
    noStroke()
    text(this.count, width * 0.5, height * 0.05)
    pop()
  }
}

function mouseClicked()
{
  if (gamestate === 'game' && !MOBILE) input.handleClick({x: mouseX, y: mouseY}) // only with PC input
  else if (gamestate === 'lobby' && !MOBILE) lobby.handleClick({x: mouseX, y: mouseY})
}

function drawLeaderBoard(pos, align)
{
  let a = align || RIGHT
  //console.log('leaderboard: ', leaderboard)
  if (leaderboard === undefined) return
  push()
  fill(255)
  textSize(16)
  let x = pos.x, y = pos.y, spacing = 16
  textAlign(a)
  text("LEADERBOARD", x, y)
  for (let i = 0; i < leaderboard.top.length; i++)
  {
    let entry = leaderboard.top[i]
    let rank = i + 1
    y += spacing
    text(rank + '\t' + entry.name + '\t' + entry.score, x, y)
  }
  pop()
}

function randomVector(max)
{
  //return createVector(random(-max, max), random(-max, max))
  return {x: random(-max, max), y: random(-max, max)}
}

function subtract(p1, p2) {
  return {
      x: p1.x - p2.x,
      y: p1.y - p2.y
  }
}

function add(p1, p2) {
  return {
      x: p1.x + p2.x,
      y: p1.y + p2.y
  }
}

function multiply(a, factor) {
  return {
      x: a.x * factor,
      y: a.y * factor
  }
}

function sqMag(v)
{
    return Math.pow(v.x, 2) + Math.pow(v.y, 2)
}

function divide(a, divisor)
{
  let factor = 1 / divisor
  return {x: a.x * factor, y: a.y * factor}
}

function sqDist(p1, p2)
{
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
}

function onCircle(p, circlepos, dia)
{ 
  return (dist(p.x, p.y, circlepos.x, circlepos.y) < dia)
}

function onField(p, area)
{
    return (p.x > area.x1 && p.x < area.x2 && p.y > area.y1 && p.y < area.y2)
}
  function inList(item, list)
  {
      for (let entry of list)
      {
          //print(item, entry)
          if (item === entry) return true
      }
      return false
  }

  function getFromList(item, list)
  {
      for (let entry of list)
      {
          if (item === entry.id) return entry
      }
      return false
  }

  function chooseOne(list, seed)
{
    if (!list.length) return false
    if (seed !== undefined) randomSeed(seed)
    let n = (random() * list.length) - 0.5
    let i = Math.round(n)
    return list[i]
}


function getTouchById(id)
{
    if (id === null) return null
    //console.log('touches', touches)
    for (let touch of touches)
    {
        //console.log('found: ', touch.id, id)
        if (touch.id === id) 
        {
            //console.log('found: ', touch)
            return touch
        }
    }
    return null
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// binary to string lookup table
const b2s = alphabet.split('');

// string to binary lookup table
// 123 == 'z'.charCodeAt(0) + 1
const s2b = new Array(123);
for (let i = 0; i < alphabet.length; i++) {
  s2b[alphabet.charCodeAt(i)] = i;
}

const bton = (base64) => {
  let number = 0;
  const sign = base64.charAt(0) === '-' ? 1 : 0;

  for (let i = sign; i < base64.length; i++) {
    number = number * 64 + s2b[base64.charCodeAt(i)];
  }

  return sign ? -number : number;
}

function isMobileDevice() {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}
function touchStarted () 
{
  //console.log(fullscreen())
  try 
  {
    fullscreen(true)
  }
  catch(err)
  {
    console.log(err)
  }
}

function writeColor(image, x, y, red, green, blue, alpha) {
  let index = (x + y * width) * 4
  image.pixels[index] = red
  image.pixels[index + 1] = green
  image.pixels[index + 2] = blue
  image.pixels[index + 3] = alpha
}

let allTextures = []
function blendTextures()
{

  blendTexture(waterTexture)
}

function blendTexture(base, neighbours)
{
  base.loadPixels()
  base.resize(50, 0)
  console.log(base.width, base.height)
  console.log(base.pixels.length)
}

function canvasGreatest()
{
    if (width > height) return width
    else return height
}

function halfScreen()
{
  return {x: width * 0.5, y: height * 0.5}
}

function isSecure()
{
    if (location.protocol === 'https:') return true
    return false
}

function windowResized() {
    print('resize')
    canvas = resizeCanvas(windowWidth, windowHeight)
    setupInput()
  }
