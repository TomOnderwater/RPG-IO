
let spikedball

let chain

function preload()
{
}

function setup() 
{
  canvas = createCanvas(windowWidth, windowHeight)
  chain = new Chain({x: width * 0.5, y: height * 0.5}, 15, 10)

  //let box = new Entity(100);
// x, y, vx, vy added random velocity in first dot to make the box rotate a little bit
 // spikedball = createSpikedBall(100)
  //fire = new Fire(createVector(width /2, height / 2), 400)
}

  function draw()
  {
    //background(0)
    background(255)
    //image(spikedball, width * 0.5, height * 0.5)
   // chain.move({x: mouseX, y: mouseY})
   // chain.update()
   chain.move({x: mouseX, y: mouseY})
    chain.update()
    //calculate force
    push()
    fill(255)
    noStroke()
    textSize(20)
    text(round(getFrameRate()), width - 100, height - 100)
    pop()
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


  class Dot {
    constructor(x, y) {
      this.pos = {x, y}
      this.oldpos = {x, y}
      //console.log(x, y)
      this.mass = 1
    }
    update(friction) 
    {
      if (this.pinned) return
      let vel = subtract(this.pos, this.oldpos)
      vel = multiply(vel, friction)
      
      this.oldpos = {x: this.pos.x, y: this.pos.y}
      this.pos = add(this.pos, vel);
    }
  }

  class Stick {
    constructor(p1, p2, length) {
      this.startPoint = p1
      this.endPoint = p2
      this.stiffness = 2

      //console.log(p1, p2)
      
      // if the length is not given then calculate the distance based on position
      if (!length) 
        this.length = Math.hypot((this.endPoint.y - this.startPoint.y), (this.endPoint.x - this.startPoint.x))
       else 
        this.length = length
    }
    render()
    {
      push()
      stroke(10)
      fill(0)
      line(this.startPoint.pos.x, this.startPoint.pos.y, this.endPoint.pos.x, this.endPoint.pos.y)
      pop()
    }
    update() {
      // calculate the distance between two dots
      let dx = this.endPoint.pos.x - this.startPoint.pos.x
      let dy = this.endPoint.pos.y - this.startPoint.pos.y
      //console.log(dx, dy)
      // pythagoras theorem
      let dist = Math.sqrt(dx * dx + dy * dy)
      // calculate the resting distance betwen the dots
      let diff = (this.length - dist) / dist * this.stiffness
    
      // getting the offset of the points
      let offsetx = dx * diff * 0.5
      let offsety = dy * diff * 0.5
    
      // calculate mass
      let m1 = this.startPoint.mass + this.endPoint.mass;
      let m2 = this.startPoint.mass / m1;
      m1 = this.endPoint.mass / m1;
    
      // and finally apply the offset with calculated mass
      if (!this.startPoint.pinned) {
        this.startPoint.pos.x -= offsetx * m1
        this.startPoint.pos.y -= offsety * m1
      }
      if (!this.endPoint.pinned) {
        this.endPoint.pos.x += offsetx * m2
        this.endPoint.pos.y += offsety * m2
      }
    }
  }
  
class Chain {
  constructor(pos, segments, seglength) {
    this.origin = pos
    this.seglength = seglength
    this.dots = []
    this.sticks = []
    this.friction = 0.99
    this.addDot(pos.x, pos.y)
    this.dots[0].pinned = true
    for (let i = 0; i < segments; i++)
    {
      this.addDot(pos.x, pos.y + i)
      this.addStick(i, i + 1, this.seglength)
    }
    this.dots[this.dots.length - 1].mass = 5
    this.stiffness = 100
  }

  drawEnd()
  {
    let dot = this.dots[this.dots.length - 1]
    push()
    fill(0)
    noStroke()
    circle(dot.pos.x, dot.pos.y, 40)
    pop()
  }

  move(p)
  {
    let dot = this.dots[0]
    dot.pos.x = p.x
    dot.pos.y = p.y
  }

  addDot(x, y) {
    this.dots.push(new Dot(x, y))
  }

  addStick(p1, p2, length) {
    this.sticks.push(new Stick(this.dots[p1], this.dots[p2], length))
  }

  updatePoints() {
    for (let i = 0; i < this.dots.length; i++) {
      this.dots[i].update(this.friction)
    }
  }

  updateSticks() {
    for (let i = 0; i < this.sticks.length; i++) {
      this.sticks[i].update()
    }
  }

  renderPoints() {
    for (let i = 0; i < this.dots.length; i++) {
      this.dots[i].render()
    }
  }
  renderSticks() {
    for (let i = 0; i < this.sticks.length; i++) {
      this.sticks[i].render()
    }
  }

  update() {

    this.updatePoints()
    for (let j = 0; j < this.stiffness; j++) {
      this.updateSticks()
    }
    this.renderSticks()
    this.drawEnd()
  }
}

  function createSpikedBall(size)
  {
    const spikes = 12
    let img = createGraphics(size, size)
    let center = size * 0.5
    img.fill(100)
    img.noStroke()
    img.circle(center, center, size * 0.4)
    for (let i = 0; i < spikes; i++)
    {
      let angle = (i / (spikes + 1)) * 2 * PI
      let a = center + Math.cos(angle) * size * 0.5
      let b = center + Math.sin(angle) * size 
    }

    return img
  }