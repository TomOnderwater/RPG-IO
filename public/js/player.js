//🥺😃🧐☹️🤪😶

const happy = '😶', neutral = '😐', hurt = '🤕'

class Player extends Entity
{
  constructor(data)
  {
    super(data)
    this.viewdistance = data.viewdistance || 12
    this.name = data.n
    this.stridelength = 0.3
    this.dia = 0.6
    this.health = data.h
    this.maxhealth = data.H
    this.animationframe = 0
    this.animationlength = 60
    this.ammo = {t: NONE, c: 0}
  }
  getFace()
  {
    let pct = this.health / this.maxhealth
    if (pct < 0.3) return hurt
    if (pct < 0.7) return neutral
    return happy
  }
  levelUP()
  {
    this.animationframe = this.animationlength
  }
  drawLevelUP(pos)
  {
    push()
    noStroke()
    fill(100, 100, 255, this.animationframe * 2)
    noStroke()
    circle(pos.x, pos.y, 20 + (this.animationlength - this.animationframe))
    noFill()
    stroke(255, 255, 255, this.animationframe * 2)
    strokeWeight(10)
    circle(pos.x, pos.y, 20 + (this.animationlength - this.animationframe) * 3)
    pop()
    this.animationframe --
  }
  drawHealthBar(offset)
  {
    let pct = this.health / this.maxhealth
    push()
    let pos = cam.onScreen({
      x: this.pos.x + offset.x, 
      y: this.pos.y + offset.y})
    let W = 1.2 * cam.zoom
    let H = 0.15 * cam.zoom
    //console.log(W, H)
    translate(pos.x, pos.y)
    stroke(0, 100)
    strokeWeight(cam.zoom * entityborder)
    rect(-W * 0.5, 0, W, H)
    noStroke()
    let w = pct * W
    fill(0, 255, 0)
    rect(-W * 0.5, 0, w, H)
    fill(255, 0, 0)
    rect(w - W * 0.5, 0, W - w, H)
    pop()
  }
  drawAmmo(offset)
  {
    if (this.ammo.c == 0) return
    let pos = cam.onScreen({
      x: this.pos.x + offset.x, 
      y: this.pos.y + offset.y})
    push()
    if (this.ammo.t === STAFF) drawItem(this.ammo.t, pos, 0.4 * cam.zoom)
    else drawItem(this.ammo.t, pos, 0.2 * cam.zoom)
      fill(255)
      textSize(16)
      noStroke()
      textAlign(CENTER, CENTER)
      text(this.ammo.c, pos.x + 20, pos.y)
    pop()
  }
  drawName(offset)
  {
    let pos = cam.onScreen({
      x: this.pos.x + offset.x, 
      y: this.pos.y + offset.y})
    push()
    fill(255)
    textSize(cam.zoom * 0.3)
    textAlign(CENTER, CENTER)
    text(this.name, pos.x, pos.y)
    pop()
  }
  draw()
  {
    // if (this.distance > this.stridelength) 
    // {
    //   sound.footstep()
    //   this.distance = 0
    // }
    let pos = cam.onScreen(this.pos)
    if (this.animationframe) this.drawLevelUP(pos)
    this.drawHealthBar({x: 0, y: -0.7})
    if (type === 'spectator' || player === this)
      this.drawAmmo({x: 0.8, y: -0.6})
  
    this.drawName({x: 0, y: -0.9})
    push()
    //console.log(this.rot)
    textAlign(CENTER, CENTER)
    translate(pos.x, pos.y)
    //fill(255)
    //stroke(0)
    rotate(this.dir + HALF_PI)
    //draw perception
    if (this.invulnerable) fill(100, 50)
    else fill(255)
    //circle(0, 0, 40)
    textSize(this.dia * cam.zoom)
    text(this.getFace(), 0, 0)

    // drawh health bar over player
    pop()
  }
    newData(data)
    {
        if (data.p) this.target = data.p
        if (data.h) this.health = data.h
        if (data.H) this.maxhealth = data.H
        if (data.a) this.ammo = data.a
        if (data.I) this.invulnerable = true
        else this.invulnerable = false
    }
  getHandPos(distance)
  {
    let x = this.pos.x + cos(this.dir - (HALF_PI + 0.5)) * distance
    let y = this.pos.y + sin(this.dir - (HALF_PI + 0.5)) * distance
    return createVector(x, y)
    //return {x,y}
  }
  getZoom()
  {
    return canvasGreatest() / this.viewdistance
  }
}