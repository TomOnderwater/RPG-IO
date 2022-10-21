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
    if (type === WOODWALL)
      this.structure = new WoodWall({x: this.x, y: this.y})
    if (type === STONEWALL)
      this.structure = new StoneWall({x: this.x, y: this.y})
    if (type === TREASURECHEST)
      this.structure = new TreasureChest({x: this.x, y: this.y})
  }
  update(tile)
  {
    this.surface = tile.s
    if (this.top !== tile.t) this.setStructure(tile.t)
    this.top = tile.t
  }
  drawTop(p)
  {
    if (this.top === AIR || typeof this.structure.drawTop !== 'function') return
   //let pos = p || cam.onScreen(createVector(this.x, this.y))
        let proximity = 3 //out of normal bounds
        if (type === 'player' && player)
        {
          let pos = p || player.pos
          if (pos.x > this.x - proximity && pos.x < this.x + proximity && 
            pos.y > this.y - proximity && pos.y < this.y + proximity)
              proximity = dist(pos.x, pos.y, this.x + 0.5, this.y + 0.5)
        }
        this.structure.drawTop(proximity)    
  }
  drawStructure()
  {
    if (this.top !== AIR)
      this.structure.draw()
  }
  drawSurface(p)
  {
    let pos = p || cam.onScreen({x: this.x + 0.5, y: this.y + 0.5})
      push()
      //stroke(0)
      let scale = cam.zoom * (1 + (TEXTUREBLEND * 2))
      imageMode(CENTER)
      let img = stoneTexture
      
      switch (this.surface) {
        case STONE:
          img = stoneTexture
          break
          case GRAVEL:
          img = gravelTexture
          break
        case DIRT:
          img = dirtTexture
        break
        case GRASS:
          img = grassTexture
        break
        case WATER:
          img = waterTexture
        break
        case SAND:
          img = sandTexture
        break
        default:
          break
      }
      image(img, pos.x, pos.y, scale, scale)
      pop()
  }
}

class StoneWall
{
  constructor(pos)
  {
    this.pos = pos
  }
  draw()
  {
    let pos = cam.onScreen(this.pos)
    push()
    image(stonewallTexture, pos.x, pos.y, cam.zoom, cam.zoom)
    noFill()
    let border = cam.zoom * entityborder
    strokeWeight(border)
    stroke(0)
    rect(pos.x, pos.y, cam.zoom, cam.zoom)
    pop()
  }
}
class WoodWall
{
  constructor(pos)
  {
    this.pos = pos
  }
  draw()
  {
    let pos = cam.onScreen(this.pos)
    push()
    image(woodenwallTexture, pos.x, pos.y, cam.zoom, cam.zoom)
    noFill()
    let border = cam.zoom * entityborder
    strokeWeight(border)
    stroke(0)
    rect(pos.x, pos.y, cam.zoom, cam.zoom)
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
    noFill()
    let border = cam.zoom * entityborder
    strokeWeight(border)
    stroke(0)
    rect(pos.x, pos.y, cam.zoom, cam.zoom)
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

class TreasureChest {
  constructor(pos)
  {
    this.pos = {x: pos.x + 0.5, y: pos.y + 0.5}
    //console.log('rock:', this.pos)
  }
  draw()
  {
    //console.log('drawing a rock')
    let pos = cam.onScreen(this.pos)
    let dia = cam.zoom
    push()
    translate(pos.x, pos.y)
    imageMode(CENTER, CENTER)
    image(chestIcon, 0, 0, dia, dia)
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
  draw()
  {
    push()
    stroke(cam.zoom * entityborder) //stroke(1)
    fill(200, 100, 50)
    let pos = cam.onScreen(this.pos)
    circle(pos.x, pos.y, cam.zoom * 0.4)
    pop()
  }
  drawTop(proximity)
  {
    //console.log('i am groot')
    let opacity = 255
    if (proximity < 2) opacity = proximity * 127
    push()
    let pos = cam.onScreen(this.pos)
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