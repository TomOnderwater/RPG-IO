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
 
    // then draw blended texture
    for (let i = 0; i < visibletiles.length; i++)
    {
      visibletiles[i].drawSurface()
    }
    this.drawBuildingEvents()
    for (let i = 0; i < visibletiles.length; i++)
    {
      visibletiles[i].drawStructure()
    }
    for (let i = 0; i < this.entities.length; i++)
    {
      this.entities[i].draw()
    }
    for (let i = 0; i < this.events.length; i++)
    {
      this.events[i].draw()
    }
    
    for (let i = 0; i < visibletiles.length; i++)
    {
      visibletiles[i].drawTop()
    }
    
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
          handleFeedback([event])
          this.events.push(new Explosion(event.pos, event.cost, event.dir))
          break
        case ARROW:
          handleFeedback([event])
          sound.bowshot(event.pos)
          break
        case FIREBALL:
          handleFeedback([event])
          sound.fireball(event.pos)
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
      if (!found) 
      {
        if (this.entities[i].kill)
          this.entities[i].kill()
        this.entities.splice(i, 1)
      }
    }
    this.addEntities(entities)
  }
  addEntities(entities)
  {
    for (let entity of entities)
    {
      //console.log(entity.t)
      switch (entity.t)
      {
        case PLAYER:
          this.entities.push(new Player(entity))
        break
        case SWORD:
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
          this.entities.push(new Critter(entity)) // CHANGE TO CRITTER
        break
        case NONE:
          this.entities.push(new Fist(entity))
          break
        case FLAIL:
          this.entities.push(new Flail(entity))
        break
        default: // items that can be held in the hand
          this.entities.push(new HandItem(entity))
        return 
      }
    }
  }
}