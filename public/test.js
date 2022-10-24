
let spikedball

function preload()
{
}

function setup() 
{
  canvas = createCanvas(windowWidth, windowHeight)
  spikedball = createSpikedBall(100)
  //fire = new Fire(createVector(width /2, height / 2), 400)
}

  function draw()
  {
    //background(0)
    background(255)
    image(spikedball, width * 0.5, height * 0.5)
    //calculate force
    push()
    fill(255)
    noStroke()
    textSize(20)
    text(round(getFrameRate()), width - 100, height - 100)
    pop()
  }

  function createSpikedBall(size)
  {
    const spikes = 12
    let img = createGraphics(size, size)
    let center = size * 0.5
    img.fill(100)
    img.noStroke()
    img.circle(center, center, size * 0.4)
    for (let i = 0; i < spikes; i++)
    {
      let angle = (i / (spikes + 1)) * 2 * PI
      let a = center + Math.cos(angle) * size * 0.5
      let b = center + Math.sin(angle) * size 
    }

    return img
  }