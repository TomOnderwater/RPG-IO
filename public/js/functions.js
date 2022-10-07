
//random functions meant for general in game purposes
function isClose(a, b) {
    return (dist(a.x, a.y, b.x, b.y) < 100)   
}

function getRelativeAngle(a, b) {
    return (((a + b) % TWO_PI) + TWO_PI) % TWO_PI
}

function bounce(p, t, bounce)
{
  return createVector(p.x + ((t.x - p.x) * bounce), p.y + ((t.y - p.y) * bounce))
}

function rumble(duration)
{
  console.log('vibratingL:', duration)
  navigator.vibrate(duration)
}

function handleFeedback(feedback)
{
  for (let event of feedback)
  {
    console.log(event)
    switch(event.type)
    {
      case 'prime':
        rumble(50)
      break
      case 'bowshot':
        rumble(20)
        //console.log(sound)
        if (sound !== undefined)
          sound.bowshot(1)
      break
      case 'damage':
          if (player.id === event.owner)
            rumble(event.damage)
      break

    }
  }
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
    }
  push()
  translate(pos.x, pos.y)
  rotate(rot)
  textAlign(CENTER, CENTER)
  textSize(size)
  text(emoji, 0, 0)
  pop()
}

function drawLeaderBoard(pos)
{
  //console.log('leaderboard: ', leaderboard)
  if (leaderboard === undefined) return
  push()
  fill(255)
  textSize(14)
  let x = pos.x, y = pos.y, spacing = 16
  text("LEADERBOARD", x, y)
  for (let i = 0; i < leaderboard.top.length; i++)
  {
    let entry = leaderboard.top[i]
    let rank = i + 1
    y += spacing
    text(rank, x, y)
    text(entry.name + " " + entry.score, x + 15, y)
  }
  pop()
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
  //let area = 
  // let area = {x1: 0, y1: 0, x2: width, y2: height}
  // for (let t of touches)
  // {
  //   if (onField(t, area) && !fullscreen()) fullscreen(true)
  // }
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
  return createVector(width / 2, height / 2)
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
