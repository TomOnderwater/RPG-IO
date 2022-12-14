function sqDist(a, b) // cheap
{
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
}

function Dist(a, b) { // use sparingly
    return Math.sqrt(sqDist(a, b))
}

function subtract(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    }
}

function add(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    }
}

function multiply(a, factor) {
    return {
        x: a.x * factor,
        y: a.y * factor
    }
}

function divide(a, factor) {
    return {
        x: a.x / factor,
        y: a.y / factor
    }
}

function Dot(a, b)
{
    return (a.x * b.x) + (a.y * b.y)
}

function invert(vec)
{
    return{x: -vec.x, y: -vec.y}
}

function bounce(p, t, b)
{
    return p + ((t - p) * b)
}

function vectorBounce(v1, v2, b)
  {
      return {x: bounce(v1.x, v2.x, b), y: bounce(v1.y, v2.y, b)}
  }

function circleOnRect(circle, rect)
{
    let x = circle.pos.x
    let y = circle.pos.y

    //console.log('testign')
    if (circle.pos.x < rect.pos.x) x = rect.pos.x
    else if (circle.pos.x > rect.pos.x + rect.width) x = rect.pos.x + rect.width
    if (circle.pos.y < rect.pos.y) y = rect.pos.y
    else if (circle.pos.y > rect.pos.y + rect.height) y = rect.pos.y + rect.height
    //console.log(x, y, sqDist({x, y}, circle.pos))
    
    let collision = (sqDist({x, y}, circle.pos) < (circle.rad * circle.rad))
    if (!collision) return false
    //console.log(x, y)
    return {x, y}
}

function rectOnRect(rect1, rect2)
{
    // return side of the collision
    let collision = (rect1.pos.x + rect1.data.width >= rect2.pos.x && 
    rect1.pos.x <= rect2.pos.x + rect2.data.width && 
    rect1.pos.y + rect1.data.height >= rect2.pos.y && 
    rect1.pos.y <= rect2.pos.y + rect2.data.height)
    
}

function circleOnCircle(circle1, circle2)
{
    // I want to return a point of collision
   let collision = (sqDist(circle1.pos, circle2.pos) <= Math.pow(circle1.rad + circle2.rad, 2))
   if (!collision) return false
   let normal = multiply(normalize(subtract(circle2.pos, circle1.pos)), circle2.rad)
   return subtract(circle2.pos, normal)
}

function normalize(vec)
{
    // use ratio for fewer divisions
    let ratio = 1 / Math.sqrt(vec.x * vec.x + vec.y * vec.y)
    return {x: vec.x * ratio, y: vec.y * ratio }
}
//v2 = v1 - 2(v1.n)n
function reflect(incident, normal)
{
    let n = normalize(normal)
    let dn = 2 * Dot(incident, n)
    //console.log(dn)
    return subtract(incident, multiply(n, dn))
}

function collideRect(rect, body)
{
    let collision = false
    switch(body.type)
    {
        case 'circle':
        collision = circleOnRect(body, rect)
        if (!collision) return false
        return collision
        break
        case 'rect':
        //console.log('not a thing')
            return rectOnRect(body, rect)
        break
    }
}

function collideCircle(circle, body)
{
    let collision = false
    switch(body.type)
    {
        case 'circle':
            // circle on circle collision
            collision = circleOnCircle(circle, body)
            if (!collision) return false
            return collision
        break
        case 'rect':
        //console.log('testing a rect with a circle')
            collision = circleOnRect(circle, body)
            if (!collision) return false
            return collision
        break
    }
}

class PhysicalBody
{
    constructor(data)
    {
        this.pos = data.pos
        this.ppos = {x: this.pos.x, y: this.pos.y}
        this.type = data.type
        this.data = data
        if (data.rad) this.rad = data.rad
        if (data.height) this.height = data.height
        if (data.width) this.width = data.width
        this.static = data.static || false
        this.speed = {x: 0, y: 0}
        this.mass = data.mass || 1
        this.drag = data.drag || 1
        this.collides = data.collides || true
        this.collider = data.collider || 0.8 
        this.bounce = data.bounce || 0.4 // rebound from collision with edges interfering with setSpeed()
    }
    update(bodies)
    {
        if (this.static) return //static, no speed
        this.pos = add(this.pos, this.speed) //update position
        if (!this.collides) return // non-collider
        let foundcollision = false
        let staticCollision = false
        for (let body of bodies)
        {
            if (body === this || !body.collides) continue //don't check with self or non-colliders
            let collision = this.collide(body)
            if (collision) 
            {
                foundcollision = true
                if (!body.static) //other body isn't static, divide forces
                {
                    // some if case if collider is 'arrow' or something to link object with parent and not do this:


                    // multiplying a matrix is cheaper than dividing
                    let dr = 1 / Dist(this.pos, body.pos)
                    let n = multiply(subtract(body.pos, this.pos), dr)
                    let p = 2 * (this.speed.x * n.x + this.speed.y * n.y - body.speed.x * n.x - body.speed.y) / (this.mass + body.mass)
                    let v1 = {x: this.speed.x - p * this.mass * n.x, y: this.speed.y - p * this.mass * n.y}
                    let v2 = {x: body.speed.x + p * body.mass * n.x, y: body.speed.x + p * body.mass * n.y}
                    v1 = multiply(v1, this.collider)
                    v2 = multiply(v2, this.collider)
                     this.speed = v1
                     body.speed = v2
                     this.pos = add(this.pos, v1)
                     body.pos = add(body.pos, v2)
                } else 
                {
                    this.speed = reflect(this.speed, subtract(collision, this.pos))
                    this.speed = multiply(this.speed, this.collider)
                    staticCollision = true
                }
            }
        }
        if (foundcollision) this.pos = this.ppos
        this.ppos = {x: this.pos.x, y: this.pos.y}
        if (staticCollision) this.pos = add(this.pos, this.speed)
        this.applyDrag()
    }
    collide(body)
    {
        switch(this.type)
        {
            case 'circle': //do the cross 
                return collideCircle(this, body)
            break
            case 'rect':
                return collideRect(this, body)
            break
        }
    }
    applyDrag()
    {
        this.speed = multiply(this.speed, this.drag)
    }
    setSpeed(spd)
    {
        this.speed = {x: spd.x, y: spd.y}
    }
    bounceSpeed(spd)
    {
        this.speed = vectorBounce(this.speed, spd, this.bounce)
    }
    applyForce(dir) // continues force, such as gravity
    {
        this.speed = add(this.speed, dir)
    }
    draw()
    {
        drawShape(this)
    }
}
function drawShape(body)
{
    if (body.type == 'circle')
    {
        push()
        fill(255, 0, 0, 100)
        circle(body.pos.x, body.pos.y, body.rad * 2)
        pop()
    }
    else if (body.type == 'rect')
    {
        push()
        fill(255, 0, 0, 100)
        rect(body.pos.x, body.pos.y, body.width, body.height)
        pop()
    }
}