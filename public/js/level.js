class Event
{
  constructor(pos, value)
  {
    this.pos = pos
    this.value = value
    this.ticks = 0
    this.maxticks = 100
  }
  draw()
  {
    let pos = camera.onScreen(this.pos)
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
   let pos = camera.onLevel(t)
   //console.log(pos)
   for (let tile of this.tiles)
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
  newData(viewport)
  {
    if (viewport.tiles) this.updateTiles(viewport)
    if (viewport.entities) this.updateEntities(viewport)
    if (viewport.events) this.updateEvents(viewport)
  }
  draw()
  {
    this.tiles.forEach(tile => tile.drawSurface())
    this.entities.forEach(entity => entity.draw())
    this.tiles.forEach(tile => tile.drawTop())
    this.events.forEach(event => event.draw())
  }
  updateEvents(viewport)
  {
    let events = viewport.events
    //console.log(events)
    events.forEach(event => this.events.push(new Event(event.pos, event.damage)))
  }
  updateTiles(leveldata)
  {
    //console.log('tiles:', leveldata.tiles)
  let newTiles = leveldata.tiles
    for (let i = this.tiles.length - 1; i >= 0; i--)
    {
      //let tile = this.tiles[i]
      let found = false
      for (let j = newTiles.length - 1; j >= 0; j--)
      {
        if (this.tiles[i].x == newTiles[j].x && this.tiles[i].y == newTiles[j].y) 
        {
          this.tiles[i].update(newTiles[j]) //update corresponding tile
          newTiles.splice(j, 1) //remove from list
          found = true //flag
          break
        }
      }
      if (!found) this.tiles.splice(i, 1) // no corresponding tile found, remove
    }
    newTiles.forEach(tile => this.tiles.push(new Tile(tile)))
    // for (let tile of newTiles)
    // {
    //   this.tiles.push(new Tile(tile))
    // }
  }
  updateEntities(leveldata)
  {
    let entities = leveldata.entities
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
        case 'none':
          this.entities.push(new Fist(entity))
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