let testbox = new PhysicalBody({type: 'rect', pos: {x:100, y:100}, width: 100, height: 100, static: true})
let testbox2 = new PhysicalBody({type: 'rect', pos: {x:220, y:100}, width: 100, height: 100, static: true})
let testcircle = new PhysicalBody({type: 'circle', pos: {x:500, y:300}, rad: 100, drag: 0.98, mass: 3})
let testcircle2 = new PhysicalBody({type: 'circle', pos: {x:720, y:300}, rad: 100, drag: 0.98, mass: 3, static: true})
let mybody = new PhysicalBody({type: 'circle', pos: {x:0, y:0}, rad: 50, drag: 0.9})

let entities = []

entities.push(testbox)
entities.push(testbox2)
entities.push(testcircle)
entities.push(testcircle2)
entities.push(mybody)

console.log(STONE)

function setup() {
  canvas = createCanvas(windowWidth, windowHeight)
  }


  function draw()
  {
    background(51, 50)

    //calculate force
    let x = (mouseX - mybody.pos.x) * 0.01
    let y = (mouseY - mybody.pos.y) * 0.01
    mybody.bounceSpeed({x,y})
    //mybody.pos.x = mouseX
    //mybody.pos.y = mouseY
    
    entities.forEach(e => e.update(entities))
    entities.forEach(e => e.draw())
  }