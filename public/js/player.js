//🥺😃🧐☹️🤪😶

class Player extends Entity
{
  constructor(data)
  {
    super(data)
    this.viewdistance = data.viewdistance || 12
    this.name = data.name
    this.stridelength = 0.3
    this.health = data.health
    this.maxhealth = data.maxhealth
    this.perception = []
    this.animationframe = 0
    this.animationlength = 60
  }
  updatePerception(perception)
  {
    this.perception = perception
    //console.log(perception)
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
  drawPerception()
  {
    for (let l of this.perception)
    {
      push()
      strokeWeight(2)
      let opacity = (6 - l.ray.dist) * 40
      stroke(255, 0, 0, opacity)
      //console.log(l.a, l.dist)
      rotate(l.a)
      line(0, 0, l.ray.dist * camera.zoom, 0)
      fill(255)
      translate(l.ray.dist * camera.zoom, 0)
      rotate(-l.a)
      text(l.ray.obj, 0, -10)
      pop()
    }
  }
  drawHealthBar(x, y)
  {
    let pct = this.health / this.maxhealth
    const W = 80
    const H = 10
    push()
    translate(x, y)
    stroke(1)
    rect(-W * 0.5, 0, W, H)
    noStroke()
    let w = pct * W
    fill(0, 255, 0)
    rect(-W * 0.5, 0, w, H)
    fill(255, 0, 0)
    rect(w - W * 0.5, 0, W - w, H)
    pop()
  }
  draw()
  {
    // if (this.distance > this.stridelength) 
    // {
    //   sound.footstep()
    //   this.distance = 0
    // }
    let pos = camera.onScreen(this.pos)
    if (this.animationframe) this.drawLevelUP(pos)
    push()
    //console.log(this.rot)
    translate(pos.x, pos.y)
    fill(255)
    textSize(20)
    textAlign(CENTER, CENTER)
    //print(this.name)
    text(this.name, 0, -70)
    stroke(0)
    this.drawHealthBar(0, -60)
    // width = 100
    this.drawPerception()

    rotate(this.dir + HALF_PI)
    //draw perception
    //fill(255, 0 ,0)
    //circle(0, 0, 40)
    textSize(this.dia)
    text('🧐', 0, 0)

    // drawh health bar over player
    pop()
  }
    newData(data)
    {
        if (data.pos) this.target = data.pos
        if (data.health) this.health = data.health
        if (data.maxhealth) this.maxhealth = data.maxhealth
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