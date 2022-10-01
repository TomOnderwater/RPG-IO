class Camera
{
  constructor(focus, zoom)
  {
    this.focus = p5.Vector.add(focus, halfScreen())
    this.zoom = zoom //zoom is ratio higher is more zoomed in
    this.invzoom = 1 / this.zoom
  }
  updateFocus(pos, _bounce)
  {
    let b = _bounce || 1
    this.focus = bounce(this.focus, pos, b)
    //print(this.focus)
  }
  updateZoom(zoom, _bounce)
  {
    let b = _bounce || 1
    this.zoom += (zoom - this.zoom) * b
    //this.zoom = this.zoom, zoom, b
  }
  onLevel(p) //which tile does the touch hit?
  {
    let pos = createVector(p.x, p.y).sub(halfScreen())
    return p5.Vector.div(pos, this.zoom).add(this.focus)
  }
  onScreen(p) //where do we draw that tile on the screen?
  {
    let pos = createVector(p.x, p.y).sub(this.focus)
    return p5.Vector.mult(pos, this.zoom).add(halfScreen())
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
}


// function updateScreen() {
//     if (orientation !== window.orientation) 
//     {
//         orientation = window.orientation
//     }
// }