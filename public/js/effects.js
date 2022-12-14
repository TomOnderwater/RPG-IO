function getFireColor(progression)
{
   const hot = color(255, 255, 200, 200)
   const orange = color(255, 150, 50, 150)
   const red = color(255, 100, 20, 100)
   const smoke = color(100, 100, 100, 50)
   let stages = 3
   let factor = 1 / stages
   if (progression < factor)
   {
     let p = (factor - progression) * stages
     return lerpColor(orange, hot, p)
   }
   if (progression < factor * 2)
   {
     let p = ((factor * 2) - progression) * stages
     return lerpColor(red, orange, p)
   }
     let p = ((factor * 3) - progression) * stages
     return lerpColor(smoke, red, p)
}

class Fire
{
  constructor(pos)
  {
    this.pos = pos
    this.pressure = 0.001
    this.pressurelimit = 0.01
    this.fireparticles = []
    this.mindia = 0.2
    this.temp = 1
  }
  addParticles(count)
  {
    for (let i = 0; i < count; i++)
    {
      this.fireparticles.push(new FireParticle(this))
    }
  }
  addSpeed(dir)
  {
    for (let i = 0; i < this.fireparticles.length; i++)
    {
      this.fireparticles[i].speed = add(this.fireparticles[i].speed, dir)
    }
  }
  kill()
  {
    this.fireparticles = []
  }
  draw(pos = this.pos)
  {
    this.pos = pos
    for (let i = 0; i < this.temp; i++)
    {
      this.fireparticles.push(new FireParticle(this))
    }
    this.fireparticles.forEach(particle => particle.draw())
    for (let i = this.fireparticles.length - 1; i >= 0; i--)
    {
      if (this.fireparticles[i].ended())
        this.fireparticles.splice(i, 1)
    }
  }
}

class FireParticle
{
  constructor(fire)
  {
    this.fire = fire
    this.speed = randomVector(0.01)
    this.pos = add(fire.pos, this.speed)
    this.maxlifetime = round(random(10, 20))
    this.lifetime = this.maxlifetime
    this.dia = random(this.fire.mindia, this.fire.mindia * 1.5)
  }
  draw()
  {
    // UPDATE
    // PRESSURE COMING FROM THE FIRE
    let pressure = this.fire.pressure / sqDist(this.pos, this.fire.pos)
    if (pressure > this.fire.pressurelimit) 
        pressure = this.fire.pressurelimit
    // VECTOR TO FIRE
    let dir = multiply(subtract(this.pos, this.fire.pos), pressure)
    this.speed = add(this.speed, add(dir, randomVector(0.001)))
    //this.speed.add(randomVector(0.1))
    this.pos = add(this.pos, this.speed)
    this.lifetime --

    // DRAW
    let pos = cam.onScreen(this.pos)
    push()
    let progression = 1 - (this.lifetime / this.maxlifetime)
    noStroke()
    let c = getFireColor(progression)
    fill(c)
    circle(pos.x, pos.y, cam.zoom * (this.dia - (progression * 0.1)))
    pop()
  }
  ended()
  {
    return this.lifetime < 0
  }
}


class Event
{
  constructor(pos, value)
  {
    this.pos = pos
    this.value = value
    this.ticks = 0
    this.maxticks = 30
    this.textpos = pos
  }
  drawValue()
  {
    this.textpos = bounce(this.textpos, {x: this.pos.x, y: this.pos.y - 0.3}, 0.2)
    let pos = cam.onScreen(this.textpos)
    push()
    textSize(cam.zoom * 0.3)
    fill(255, 50 + (205 * (1 - (this.ticks / this.maxticks))))
    noStroke()
    text(this.value, pos.x, pos.y)
    pop()
  }
  update()
  {
    this.ticks ++
  }
  ended()
  {
    return this.ticks > this.maxticks
  }
}

class ContinuedFire
{
  constructor(fire)
  {
    this.fire = fire
    this.fire.temp = 0
    this.ticks = 0
    this.maxticks = 30
  }
  draw()
  {
    this.fire.draw()
  }
  update()
  {
    this.ticks ++
  }
  ended()
  {
    return this.ticks > this.maxticks
  }
}

class Explosion
{
  constructor(pos, cost, dir)
  {
    this.pos = pos
    this.cost = cost
    this.ticks = 0
    this.maxticks = 30
    this.fire = new Fire(this.pos)
    this.fire.pressure = 0.0005 * this.cost
    this.fire.pressurelimit = 0.1 * this.cost
    this.fire.mindia = 0.3
    this.fire.temp = 0
    this.dir = dir || {x: 0, y: 0}
    //console.log(this.dir)
    this.fire.addParticles(30 * this.cost) //30
    this.fire.addSpeed(this.dir)
    sound.explosion(this.pos, this.cost)
  }
  draw()
  {
    this.fire.draw(this.pos)
  }
  update()
  {
    this.ticks ++
  }
  ended()
  {
    return this.ticks > this.maxticks
  }
}

class Impact extends Event
{
  constructor(pos, damage, dir, type)
  {
    super (pos, damage)
    this.maxticks = 30
    this.type = type
    let splattercount = Math.round(random(1, (damage + 1) * 0.5))
    if (splattercount > 10) splattercount = 10
    this.splatters = []
    if (type === 'blood')
      sound.splashimpact(pos, damage)
    if (type === 'stone')
      sound.basicimpact(pos, damage)
    for (let i = 0; i < splattercount; i++)
    {
      this.splatters.push(new Splatter(pos, dir, this.maxticks, type))
    }
  }
  draw()
  {
    for (let i = this.splatters.length - 1; i >= 0; i--)
    {
      let ended = this.splatters[i].draw()
      if (ended) this.splatters.slice(i, 1)
    }
    this.drawValue()
  }
}

class Splatter
{
  constructor(pos, dir, maxticks, type)
  {
    this.pos = pos
    this.dia = random(0.04, 0.12) * cam.zoom
    this.diaincrement = 0.004 * cam.zoom
    this.mult = random(0.3, 0.7)
    this.type === type
    this.color = {r: 255, g: 0, b: 0}
    if (skin === 'ice')
      this.color = {r: 150, g: 150, b: 255}
    if (type === 'stone')
      this.color = {r: 100, g: 100, b: 100}
      
    this.dir = createVector(dir.x, dir.y).rotate(random(-0.2, 0.2)).mult(0.5)
    this.ticks = Math.round(random(maxticks * 0.5, maxticks))
  }

  draw()
  {
    this.pos = add(this.pos, this.dir)
    this.dir.mult(this.mult)
    let pos = cam.onScreen(this.pos)
    this.dia += this.diaincrement
    push()
    noStroke()
    fill(this.color.r, this.color.g, this.color.b, this.ticks * 2)
    if (skin === 'ice')
    {
      rectMode(CENTER)
      rect(pos.x, pos.y, this.dia, this.dia)
    }
    else circle(pos.x, pos.y, this.dia)
    pop()
    this.ticks --
    return (this.ticks <= 0)
  }
}

class Woosh extends Event
{
  constructor(p1, p2, len)
  {
    super(p1, 0)
    this.p1 = p1
    this.p2 = p2
    //console.log(this.p1, this.p2)
    this.angle = atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x)
    this.reach = dist(this.p1.x, this.p1.y, this.p2.x, this.p2.y) * cam.zoom
    this.len = len * cam.zoom
    //console.log(this.len, this.reach)
    this.maxticks = round(this.reach * 0.6)
  }
  draw()
  {
    let p1 = cam.onScreen(this.p1)
    push()
    noStroke()
    fill(255, 4 * this.maxticks - (this.ticks * 4))
    translate(p1.x, p1.y)
    rectMode(CORNERS)
    rotate(this.angle)
    rect(0, -this.len * 0.5, this.reach, this.len*0.5)
    pop()
  }
}