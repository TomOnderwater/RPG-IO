class Tile {
  constructor(tile)
  {
    this.x = tile.x
    this.y = tile.y
    this.surface = tile.s
    this.top = tile.t
    this.setStructure(this.top)
    this.selected = false
    this.selectborder = 5
  }
  setStructure(type)
  {
    if (type === TREE)
      this.structure = new Tree({x: this.x, y: this.y}, this.x * 1.4243 + this.y * 0.563)
    if (type === WALL)
      this.structure = new Wall({x: this.x, y: this.y})
    if (type === ROCK)
      this.structure = new Rock({x: this.x, y: this.y})
  }
  update(tile)
  {
    this.surface = tile.s
    if (this.top !== tile.t) this.setStructure(tile.t)
    this.top = tile.t
  }
  drawTop(p)
  {
    if (this.top === AIR) return
    let pos = p || cam.onScreen(createVector(this.x, this.y))
    push()
      if (this.top !== TREE)
      {
        this.structure.draw()
        //fill(0, 100)
        
        //rect(pos.x, pos.y, cam.zoom, cam.zoom)
      } else 
      {
        let proximity = 3 //out of normal bounds
        if (type === 'player' && player)
        {
          if (player.pos.x > this.x - proximity && player.pos.x < this.x + proximity && 
            player.pos.y > this.y - proximity && player.pos.y < this.y + proximity)
              proximity = dist(player.pos.x, player.pos.y, this.x + 0.5, this.y + 0.5)
        }
        if (this.top === TREE) this.structure.draw(proximity)    
      }
    pop()
  }
  drawSurface(p)
  {
    let pos = p || cam.onScreen(createVector(this.x, this.y))
      push()
      stroke(0)
      switch (this.surface) {
        case STONE:
          fill(120, 120, 120)
          break
          case GRAVEL:
          fill(160, 160, 180)
          break
        case DIRT:
          fill(200, 100, 50)
        break
        case GRASS:
          fill(100, 180, 0)
        break
        case WATER:
          fill(0, 0, 255)
        break
        case SAND:
          fill(255, 255, 0)
        break
        default:
          break
      }
      rect(pos.x, pos.y, cam.zoom, cam.zoom)
      //draw thing on top
      noFill()
      stroke(255, 255, 255, 180)
      strokeWeight(this.selectborder)
      if (this.selected) rect(pos.x + this.selectborder * 0.5, pos.y + this.selectborder * 0.5, 
      cam.zoom - this.selectborder , cam.zoom - this.selectborder)
      pop()
  }
}

class Wall {
  constructor(pos)
  {
    this.pos = pos
  }
  draw()
  {
    let pos = cam.onScreen(this.pos)
    push()
    image(walltexture, pos.x, pos.y, cam.zoom, cam.zoom)
    pop()
  }
}

class Rock {
  constructor(pos)
  {
    this.pos = createVector(pos.x + 0.5, pos.y + 0.5)
    //console.log('rock:', this.pos)
  }
  draw()
  {
    //console.log('drawing a rock')
    let pos = cam.onScreen(this.pos)
    let dia = cam.zoom * 1.2
    push()
    translate(pos.x, pos.y)
    imageMode(CENTER, CENTER)
    image(rocktexture, 0, 0, dia, dia)
    pop()
  }
}

class Tree {
  constructor(pos, seed)
  {
     this.branches = []
     this.pos = createVector(pos.x + 0.5, pos.y + 0.5)
       randomSeed(seed)
      let branches = round(random(3, 5))
      for (let i = 0; i < branches; i ++)
      {
        let leafcolor = i * 8 //leaves become more yellow nearer to the top
      //let leafcolor = random(-20, 20)
      let size = (4 / (i + 4))
      let x = this.pos.x + random(-0.4, 0.4)
      let y = this.pos.y + random(-0.4, 0.4)
      let dia = random(size, size + 0.2)
      this.branches.push({pos: {x,y}, dia, leafcolor})
    }
  }
  draw(proximity)
  {
    //console.log('i am groot')
    let opacity = 255
    if (proximity < 2) opacity = proximity * 127
    push()
    stroke(1)
    fill(200, 100, 50)
    let pos = cam.onScreen(this.pos)
    circle(pos.x, pos.y, cam.zoom * 0.2)
    noStroke()
    if (opacity == 255) fill(50, 150, 0)
    else fill(50, 150, 0, opacity)
    circle(pos.x, pos.y, cam.zoom * 0.5)
    for (let branch of this.branches)
    {
      let pos = cam.onScreen(branch.pos)
      if (opacity == 255) fill(50 + branch.leafcolor, 150 + branch.leafcolor, 30)
      else fill(50 + branch.leafcolor, 150 + branch.leafcolor, 30, opacity)
      circle(pos.x, pos.y, branch.dia * cam.zoom)
    }
    pop()
  }
}