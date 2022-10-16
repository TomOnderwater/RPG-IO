class Event
{
  constructor(pos, value)
  {
    this.pos = pos
    this.value = value
    this.ticks = 0
    this.maxticks = 100
  }
  drawValue()
  {
    let pos = cam.onScreen(this.pos)
    push()
    textSize(20)
    fill(255)
    stroke(0)
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

class Explosion
{
  constructor(pos)
  {
    this.pos = pos
    this.ticks = 0
    this.maxticks = 30
    this.fire = new Fire(this.pos)
    this.fire.addParticles(30)
    this.fire.pressure = 0.0005
    this.fire.pressurelimit = 0.1
    this.fire.temp = 0
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
  constructor(pos, damage, dir, color)
  {
    super (pos, damage)
    this.maxticks = 50 + damage
    this.color = color
    let splattercount = Math.round(random(1, (damage + 1) * 0.5))
    this.splatters = []
    for (let i = 0; i < splattercount; i++)
    {
      this.splatters.push(new Splatter(pos, damage, dir, this.maxticks, this.color))
    }
  }
  draw()
  {
    for (let i = this.splatters.length - 1; i >= 0; i--)
    {
      let ended = this.splatters[i].draw()
      if (ended) this.splatters.slice(i, 1)
    }
  }
}

class Splatter
{
  constructor(pos, damage, dir, maxticks, color)
  {
    this.pos = createVector(pos.x, pos.y)
    this.dia = random(0.02, 0.08 + 0.01 * damage) * cam.zoom
    this.diaincrement = 0.004 * cam.zoom
    this.mult = random(0.5, 0.9)
    this.color = color
    this.dir = createVector(dir.x, dir.y).rotate(random(-0.2, 0.2)).mult(0.5)
    this.ticks = Math.round(random(maxticks * 0.5, maxticks))
  }
  draw()
  {
    this.pos.add(this.dir)
    this.dir.mult(this.mult)
    let pos = cam.onScreen(this.pos)
    this.dia += this.diaincrement
    push()
    noStroke()
    fill(this.color.r, this.color.g, this.color.b, this.ticks * 2)
    circle(pos.x, pos.y, this.dia)
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


class Level {
  constructor()
  {
    this.tiles = []
    this.entities = []
    this.events = []
    this.buildingevents = []
  }
  checkTouches()
  {
   let t = input.getFreeTouch()
   //console.log(t)
   if (!t) return
   let pos = cam.onLevel(t)
   //console.log(pos)
   let visibletiles = this.getVisibleTiles(player)
   for (let tile of visibletiles)
   {
      if (onField(pos, {x1: tile.x, y1: tile.y, x2: tile.x + 1, y2: tile.y + 1}))
      {
        tile.selected = !tile.selected
        input.addTouch(t)
        break
      }
    }
  }
  getPlayer(id)
  {
    for (let entity of this.entities)
    {
      if (entity.id === id) return entity
    }
    return null
  }
  update()
  {
        this.entities.forEach(entity => entity.update())
        for (let i = this.events.length - 1; i >= 0; i--)
        {
          let event = this.events[i]
          event.update()
          if (event.ended()) this.events.splice(i, 1)
        }
  }

  initLevel(leveldata)
  {
    this.tiles = []
    this.height = leveldata.height
    this.width = leveldata.width
    for (let x = 0; x < leveldata.cols.length; x++)
      {
        let col = []
        let datacol = leveldata.cols[x]
        for (let tile of datacol)
        {
          col.push(new Tile(tile))
        }
        this.tiles.push(col) 
      }
  }
  newData(viewport)
  {
    if (viewport.level) this.initLevel(viewport.level)
    if (viewport.entities) this.updateEntities(viewport.entities)
    if (viewport.events) this.updateEvents(viewport.events)
    if (viewport.updates) this.updateStructures(viewport.updates)
    if (viewport.builds) this.updateBuildingEvents(viewport.builds)
  }
  draw()
  {
    //console.log(type)
    let range = cam.getRange()
    let visibletiles = this.getVisibleTiles(range)
    //let visibletiles = this.getVisibleTiles(player)

    // DRAW ORDER 
    // surface -> structures -> entities -> events (blood etc.) -> roofing
    visibletiles.forEach(tile => tile.drawSurface())
    this.drawBuildingEvents()
    visibletiles.forEach(tile => tile.drawStructure())
    this.entities.forEach(entity => entity.draw())
    this.events.forEach(event => event.draw())
    visibletiles.forEach(tile => tile.drawTop())
  }
  drawBuildingEvents()
  {
    //console.log(this.buildingevents)
    for (let buildingevent of this.buildingevents)
    {
      let pos = cam.onScreen(buildingevent.p)
      let b2 = cam.zoom * 0.25
      let border = (1 - buildingevent.c) * b2
      push()
      noFill()
      stroke(255, 100 - buildingevent.c)
      strokeWeight(b2 - border)
      //console.log(border)
      translate(pos.x, pos.y)

      rect(border, border, cam.zoom - (2 * border), cam.zoom - (2 * border), 5, 5)
      pop()
    }
  }
  getVisibleTiles(range)
  {
    let tiles = []
    for (let x = range.x1; x < range.x2; x++)
     {
      for (let y = range.y1; y < range.y2; y++)
      {
        tiles.push(this.tiles[x][y])
      }
     }
    return tiles
  }
  addWoosh(p1, p2, len)
  {
    this.events.push(new Woosh(p1, p2, len))
  }
  updateBuildingEvents(buildingevents)
  {
    this.buildingevents = buildingevents
  }
  updateEvents(events)
  {
    //console.log(events)
    events.forEach(event => 
    {
      switch(event.type)
      {
        case 'damage':
          this.events.push(new Impact(event.pos, event.damage, event.dir, event.target.color))
          break
        case 'explosion':
          this.events.push(new Explosion(event.pos))
        break
    }
  })
  if (player) handleFeedback(events)
}
  updateStructures(newtiles)
  {
    // {x: y: s:, t: }
    newtiles.forEach(tile => this.getTile(tile.x, tile.y).update(tile))
  }
  getTile(x, y)
  {
    return this.tiles[x][y]
  }
  updateEntities(entities)
  {
    //console.log(entities)
    for (let i = this.entities.length - 1; i >= 0; i--)
    {
      let found = false
      for(let j = entities.length - 1; j >= 0; j--)
      {
        if (this.entities[i].id === entities[j].i &&
        this.entities[i].type === entities[j].t) //same entity
        {
          this.entities[i].newData(entities[j])
          entities.splice(j, 1)
          found = true
          break
        }
      }
      if (!found) this.entities.splice(i, 1)
    }
    this.addEntities(entities)
  }
  addEntities(entities)
  {
    for (let entity of entities)
    {
      console.log(entity.t)
      switch (entity.t)
      {
        case PLAYER:
          this.entities.push(new Player(entity))
        break
        case SWORD:
        //console.log('got a sword')
          this.entities.push(new Sword(entity))
        break
        case BOW:
          this.entities.push(new Bow(entity))
          break
        case STAFF:
          this.entities.push(new Staff(entity))
          break
        case FIREBALL:
          this.entities.push(new FireBall(entity))
          break
        case ARROW:
          this.entities.push(new Arrow(entity))
        break
        case SLIME:
          this.entities.push(new Entity(entity)) // CHANGE TO CRITTER
        break
        case NONE:
          this.entities.push(new Fist(entity))
          break
        default: // items that can be held in the hand
          this.entities.push(new HandItem(entity))
        return 
      }
    }
  }
}