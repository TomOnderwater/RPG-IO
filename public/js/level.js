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

class Slash extends Event
{
  constructor(pos, damage, dir)
  {
    super (pos, damage)
    let splatters = Math.round(random(1, (damage + 1) * 0.5))
    this.bloodspatters = []
    for (let i = 0; i < splatters; i++)
    {
      this.bloodspatters.push(new Blood(pos, damage, dir))
    }
  }
  draw()
  {
    for (let i = this.bloodspatters.length - 1; i >= 0; i--)
    {
      let ended = this.bloodspatters[i].draw()
      if (ended) this.bloodspatters.slice(i, 1)
    }
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
class Blood
{
  constructor(pos, damage, dir)
  {
    this.pos = createVector(pos.x, pos.y)
    this.dia = random(3, 5 + damage)
    this.diaincrement = 0.1
    this.mult = random(0.5, 0.9)
    this.dir = createVector(dir.x, dir.y).rotate(random(-0.2, 0.2)).mult(0.5)
    this.ticks = Math.round(random(50, 60 + damage))
  }
  draw()
  {
    this.pos.add(this.dir)
    this.dir.mult(this.mult)
    let pos = cam.onScreen(this.pos)
    this.dia += this.diaincrement
    push()
    noStroke()
    fill(255, 0, 0, this.ticks * 2)
    circle(pos.x, pos.y, this.dia)
    pop()
    this.ticks --
    return (this.ticks <= 0)
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
      let border = buildingevent.c * cam.zoom * 0.25
      push()
      noFill()
      stroke(255, 100 - buildingevent.c)
      strokeWeight(border)
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
      if (event.type == 'damage') 
        this.events.push(new Slash(event.pos, event.damage, event.dir))
    })
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
      //console.log(entity.type)
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
        case NONE:
          this.entities.push(new Fist(entity))
        break
        case ARROW:
          this.entities.push(new Arrow(entity))
        break
        case WOOD:
          this.entities.push(new Wood(entity))
        break
        case ROCK:
          this.entities.push(new Stone(entity))
        break
        // case 'slime':
        //   console.log('slime spawn')
        // break

        default:
        console.log('unknown entity detected')
          this.entities.push(new Entity(entity))
        break
      }
    }
  }
}