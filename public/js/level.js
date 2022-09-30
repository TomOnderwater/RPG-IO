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
    this.width = leveldata.width
    this.height = leveldata.height
    this.updateTiles(leveldata.tiles)
  }
  newData(viewport)
  {
    if (viewport.tiles) this.updateTiles(viewport.tiles)
    if (viewport.entities) this.updateEntities(viewport.entities)
    if (viewport.events) this.updateEvents(viewport.events)
    if (viewport.updates) this.updateStructures(viewport.updates)
  }
  draw()
  {
    //console.log(type)
    // get the zoom distance necessary
    //if (type)
    let visibletiles = (type !== 'spectator' && player) ? this.getVisibleTiles(player) :
      this.getVisibleTiles({pos: cam.focus, viewdistance: 40})
    //let visibletiles = this.getVisibleTiles(player)
    //console.log(this.visibletiles)
    visibletiles.forEach(tile => tile.drawSurface())
    this.entities.forEach(entity => entity.draw())
    visibletiles.forEach(tile => tile.drawTop())
    this.events.forEach(event => event.draw())
  }
  getVisibleTiles(perspective)
  {
    let pos = perspective.pos
    //console.log(perspective)
    let range = perspective.viewdistance
    let x1 = Math.round(pos.x) - range
    if (x1 < 0) x1 = 0
    let y1 = Math.round(pos.y) - range
    if (y1 < 0) y1 = 0

    let x2 = Math.round(pos.x) + range
    if (x2 > this.width - 1) x2 = this.width - 1
    let y2 = Math.round(pos.y) + range
    if (y2 > this.height - 1) y2 = this.height - 1
    let tiles = []
    for (let tile of this.tiles)
    {
      if (tile.x >= x1 && tile.x <= x2 && tile.y >= y1 && tile.y <= y2)
        tiles.push(tile)
    }
    return tiles
  }
  updateEvents(events)
  {
    //console.log(events)
    events.forEach(event => 
    {
      if (event.type == 'damage') this.events.push(new Slash(event.pos, event.damage, event.dir))
    })
  }
  updateTiles(tiles)
  {
    console.log('tiles: ', tiles)
    for (let i = this.tiles.length - 1; i >= 0; i--)
    {
      for (let j = tiles.length - 1; j >= 0; j--)
      {
        if (this.tiles[i].x == tiles[j].x && this.tiles[i].y == tiles[j].y) 
        {
          this.tiles[i].update(tiles[j]) //update corresponding tile
          tiles.splice(j, 1) //remove from list
          break
        }
      }
    }
    tiles.forEach(tile => this.tiles.push(new Tile(tile)))
  }
  updateStructures(newtiles)
  {
    // {x: y: s:, t: }
    newtiles.forEach(tile => this.getTile(tile.x, tile.y).update(tile))
  }
  getTile(x, y)
  {
    for (let tile of this.tiles)
    {
      if (tile.x === x && tile.y === y) return tile
    }
  }
  updateEntities(entities)
  {
    //console.log(entities)
    for (let i = this.entities.length - 1; i >= 0; i--)
    {
      let found = false
      for(let j = entities.length - 1; j >= 0; j--)
      {
        if (this.entities[i].id === entities[j].id &&
        this.entities[i].type === entities[j].type) //same entity
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
      switch (entity.type)
      {
        case 'player':
          this.entities.push(new Player(entity))
        break
        case 'sword':
        //console.log('got a sword')
          this.entities.push(new Sword(entity))
        break
        case 'bow':
          this.entities.push(new Bow(entity))
          break
        case 'none':
          this.entities.push(new Fist(entity))
        break
        case 'arrow':
          this.entities.push(new Arrow(entity))
        break
        case 'wood':
          this.entities.push(new Wood(entity))
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