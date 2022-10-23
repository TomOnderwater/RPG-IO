class Camera
{
  constructor(focus, zoom)
  {
    this.focus = add(focus, halfScreen()) //p5.Vector.add(focus, halfScreen())
    this.zoom = zoom //zoom is ratio higher is more zoomed in
  }
  updateFocus(pos, _bounce)
  {
    let b = _bounce || 1
    this.focus = bounce(this.focus, pos, b)
    //print(this.focus)
  }
  updateZoom(zoom, _bounce)
  {
    if (zoom !== this.zoom) resetTextures(zoom, TEXTUREBLEND)
    this.zoom = zoom
    //let b = _bounce || 1
    //this.zoom += (zoom - this.zoom) * b
  }
  getRelativePos(pos)
  {
    // where am i?
    return subtract(pos, this.focus)
  }
  onLevel(p)
  {
    let pos = subtract(p, halfScreen())
    return add(divide(pos, this.zoom), this.focus)
    //return p5.Vector.div(pos, this.zoom).add(this.focus)
  }
  onScreen(p)
  {
    let pos = subtract(p, this.focus)
    return add(multiply(pos, this.zoom), halfScreen())
    //let pos = createVector(p.x, p.y).sub(this.focus)
    //return p5.Vector.mult(pos, this.zoom).add(halfScreen())
  }
  zoomToLevel(level)
  {
    // check orientation
    if (level.width === undefined || level.height === undefined) 
      return this.zoom
    if (level.width > level.height)
    {
      let zoom = width / level.width
      if (zoom * level.height > height)
        this.zoom = height / level.height
      else this.zoom = zoom
    }
    else 
    {
      let zoom = height / level.height
      if (zoom * level.width > width)
        this.zoom = width / level.width
      else this.zoom = zoom
    }
  }
  getRange()
  {
    let halfwidth = (width / this.zoom) * 0.5
    let halfheight = (height / this.zoom) * 0.5
    let x1 = constrain(round(this.focus.x - halfwidth - 1), 0, level.width)
    let x2 = constrain(round(this.focus.x + halfwidth + 1), 0, level.width)
    let y1 = constrain(round(this.focus.y - halfheight - 1), 0, level.height)
    let y2 = constrain(round(this.focus.y + halfheight + 1), 0, level.height)
    return {x1, x2, y1, y2}
  }
}

  /*
   texture creator helper function, scales texture to specified zoom, only works with square images
   */


function getPixel(img, p)
  {
    let index = ((p.y * img.width) + p.x) * 4
    return {
      r: img.pixels[index],
      g: img.pixels[index + 1],
      b: img.pixels[index + 2],
      a: img.pixels[index + 3]
    }
  }

  function setPixel(img, p, pixel, alpha) {
    let index = (p.x + p.y * img.width) * 4
    img.pixels[index] = pixel.r
    img.pixels[index + 1] = pixel.g
    img.pixels[index + 2] = pixel.b
    img.pixels[index + 3] = alpha
  }
  function createTexture(tex, zoom, b)
  {
     console.log(tex, zoom)
    //console.log(tex.width ,tex.height)
    let border = Math.round(tex.width * b)
    //console.log(border)
    tex.loadPixels()
    let cols = []
    for (let x = 0; x < tex.width; x++)
    {
      let col = []
      for (let y = 0; y < tex.height; y++)
      {
        col.push(getPixel(tex, {x, y}))
        //console.log(getPixel(tex, {x, y}))
      }
      cols.push(col)
    }
    // /console.log(cols)
    tex.updatePixels()

    let copy = createImage(tex.width + 2 * border, tex.height + 2 * border)
    copy.loadPixels()
    //console.log(copy.width, copy.height)
    let b2 = border
    for (let x = 0; x < copy.width; x++)
    {
      let x_ = (x + tex.width) % tex.width
      let alpha = 255
        // get alpha value of the area
      if (x < b2)
          alpha = 255 * (x / b2)
      if (x > copy.width - b2)
          alpha = 255 * (1 -((x - (copy.width - b2)) / b2))
      //console.log(x, alpha)
      for (let y = 0; y < copy.height; y++)
      {
        let beta = 255
        if (y < b2)
          beta = 255 * (y / b2)
        if (y > copy.height - b2)
          beta = 255 * (1 -((y - (copy.height - b2)) / b2))
        let gamma = (alpha < beta) ? alpha : beta
        //let gamma = (alpha + beta) / 2
        let y_ = (y + tex.height) % tex.height
        setPixel(copy, {x,y}, cols[x_][y_], gamma)
        //console.log(getPixel(tex, {x, y}))
      }
    }
    
    copy.updatePixels()
    //console.log(copy)
    copy.resize(zoom * (1 + (2 * b)), zoom * (1 + (2 * b)))
    return copy
  }