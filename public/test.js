
const soundfolder = 'assets/sound_effects/'

let fireballs = []

let sound

function setup() 
{
  canvas = createCanvas(windowWidth, windowHeight)
  sound = new SoundMaster()
  //fire = new Fire(createVector(width /2, height / 2), 400)
  for (let i = 0; i < 5; i++)
  {
    fireballs.push(new FireBall(createVector(random(width), random(height))))
  }
}

  function draw()
  {
    background(0)
    
    for (let i = 0; i < fireballs.length; i++)
    {
      if (mouseIsPressed) fireballs[i].attract({x: mouseX, y: mouseY})
      fireballs[i].draw()
    } 
    //calculate force
    push()
    fill(255)
    noStroke()
    textSize(20)
    text(round(getFrameRate()), width - 100, height - 100)
    pop()
  }

  function mouseClicked()
  {
    sound.woosh()
  }

  class SoundMaster
{
  constructor()
  {
    this.basepath = 'assets/sound_effects'
    this.swordwoosh = new Howl({src: [soundfolder + 'swoosh1.mp3']})
  }
  woosh()
  {
    this.swordwoosh.play()
  }
}


/*
sound effects:

𝙢𝙚𝙡𝙡𝙖𝙜𝙚 by Apoxode (c) copyright 2022 Licensed under a Creative Commons Attribution Noncommercial  (3.0) license. http://dig.ccmixter.org/files/Apoxode/65326 Ft: Javolenus, septahelix, Speck

*/
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

function sqDist(p1, p2)
{
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
}

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

class FireBall
{
  constructor(pos)
  {
    this.pos = pos
    this.fire = new Fire(this.pos)
    this.speed = randomVector(0.01)
  }
  draw()
  {
    this.pos = add(this.pos, this.speed)
    if (this.pos.y > height || this.pos.y < 0) 
    {
      this.speed.y *= -0.95
    }
    if (this.pos.x < 0 || this.pos.x > width) this.speed.x *= -0.95
    this.fire.pos = this.pos
    this.fire.draw()
  }
  attract(pos)
  {
    let force = 100 / sqDist(this.pos, pos)
    let angle = Math.atan2(pos.y - this.pos.y, pos.x - this.pos.x)
    this.addForce({x: Math.cos(angle) * force, y: Math.sin(angle) * force})
  }
  addForce(force)
  {
    this.speed = add(this.speed, force)
  }
}

class Fire
{
  constructor(pos)
  {
    this.pos = pos
    this.pressure = 0.5
    this.fireparticles = []
    this.temp = 2
  }
  draw()
  {
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
    this.speed = randomVector(0.5)
    this.pos = add(fire.pos, this.speed)
    this.maxlifetime = round(random(10, 20))
    this.lifetime = this.maxlifetime
    this.dia = random(20, 30)
  }
  draw()
  {

    // UPDATE
    // PRESSURE COMING FROM THE FIRE
    let pressure = this.fire.pressure / sqDist(this.pos, this.fire.pos)
    pressure = constrain(pressure, 0, 10)
    // VECTOR TO FIRE
    let dir = multiply(subtract(this.pos, this.fire.pos), pressure)
    this.speed = add(this.speed, add(dir, randomVector(0.1)))
    //this.speed.add(randomVector(0.1))
    this.pos = add(this.pos, this.speed)
    this.lifetime --

    // DRAW
    push()
    let progression = 1 - (this.lifetime / this.maxlifetime)
    noStroke()
    let c = getFireColor(progression)
    fill(c)
    circle(this.pos.x, this.pos.y, this.dia - (progression * 15))
    pop()
  }
  ended()
  {
    return this.lifetime < 0
  }
}