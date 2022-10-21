

const soundfolder = 'assets/sound_effects/'

let dirt, dirt2, grass, grass2

let zoom = 96
const BLEND = 0.3

function preload()
{
 dirt = loadImage('assets/textures/dirt_texture1.jpg')
 grass = loadImage('assets/textures/seamless_grass1.jpg')
}

function setup() 
{
  canvas = createCanvas(windowWidth, windowHeight)
  //fire = new Fire(createVector(width /2, height / 2), 400)
  dirt2 = createTexture(dirt, zoom, BLEND)
  grass2 = createTexture(grass, zoom, BLEND)
}

  function draw()
  {
    //background(0)
    
    //calculate force
    push()
    fill(255)
    noStroke()
    textSize(20)
    imageMode(CENTER)
    image(dirt2, width * 0.5, height * 0.5)
    image(grass2, width * 0.5 + zoom, height * 0.5)
    image(grass2, width * 0.5 + zoom, height * 0.5 + zoom)
    image(grass2, width * 0.5, height * 0.5 + zoom)
    image(grass2, width * 0.5, height * 0.5 - zoom)
    text(round(getFrameRate()), width - 100, height - 100)
    pop()
  }

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

  /*
   texture creator helper function, scales texture to specified zoom, only works with square images
   */

  function createTexture(tex, zoom, b)
  {
    // /console.log(tex, zoom)
    //console.log(tex.width ,tex.height)
    let border = Math.round(tex.width * b)
    console.log(border)
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