
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

function drawFrameRate(pos)
{
  push()
  fill(255)
  textSize(16)
  text('fps: ' + round(getFrameRate()), pos.x, pos.y)
  pop()
}
function drawWood(pos, size, rot)
{
  push()
  translate(pos.x, pos.y)
  rotate(rot || 0)
  imageMode(CENTER)
  image(woodicon, 0, 0, size, size)
  pop()
}
function drawItem(type, pos, size)
{
  let emoji = ''
  switch (type)
  {
    case SWORD:
      emoji = '🗡️'
      break
    case BOW:
      emoji = '🏹'
      break
    case WOOD:
      drawWood(pos, size)
      break
  }
  push()
  textAlign(CENTER, CENTER)
  textSize(size)
  text(emoji, pos.x, pos.y)
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

function isMobileDevice() {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}
function touchStarted () 
{
  //console.log(fullscreen())
  fullscreen(true)
  //let area = 
  // let area = {x1: 0, y1: 0, x2: width, y2: height}
  // for (let t of touches)
  // {
  //   if (onField(t, area) && !fullscreen()) fullscreen(true)
  // }
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
