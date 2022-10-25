const Func = require('./functions.js')


class Dot {
    constructor(x, y) {
      this.pos = {x, y}
      this.oldpos = {x, y}
      this.mass = 1
    }
    update(friction) 
    {
      if (this.pinned) return
      let vel = Func.subtract(this.pos, this.oldpos)
      vel = Func.multiply(vel, friction)
      
      this.oldpos = {x: this.pos.x, y: this.pos.y}
      this.pos = Func.add(this.pos, vel);
    }
  }

  class Stick {
    constructor(p1, p2, length) {
      this.startPoint = p1
      this.endPoint = p2
      this.stiffness = 2
      // if the length is not given then calculate the distance based on position
      if (!length) 
        this.length = Math.hypot((this.endPoint.y - this.startPoint.y), (this.endPoint.x - this.startPoint.x))
       else 
        this.length = length
        //console.log(this.startPoint, this.endPoint, this.length)
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

module.exports = class Chain
{
constructor(pos, segments, seglength = 0.1, endmass = 1)
{
    this.pos = pos
    this.segments = segments
    this.dots = []
    this.sticks = []
    this.friction = 0.99
    this.seglength = seglength
    this.addDot(pos.x, pos.y)
    this.dots[0].pinned = true
    for (let i = 0; i < segments; i++)
    {
    if (i % 2 == 0) this.addDot(pos.x, pos.y + this.seglength)
    else this.addDot(pos.x, pos.y)
    this.addStick(i, i + 1, this.seglength)
    }
    this.dots[this.dots.length - 1].mass = endmass
    this.stiffness = 10
    }
  move(p)
  {
    let dot = this.dots[0]
    dot.pos.x = p.x
    dot.pos.y = p.y
  }
  getEnd()
  {
    return this.dots[this.dots.length - 1]
  }
  getPoints()
  {
    let points = []
    for (let i = 0; i < this.dots.length; i++)
    {
        points.push(Func.fixPos(this.dots[i].pos, 2))
    }
    return points
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
  update() {

    this.updatePoints()
    for (let j = 0; j < this.stiffness; j++) {
      this.updateSticks()
        }
    }
}