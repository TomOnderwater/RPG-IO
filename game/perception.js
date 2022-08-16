const Func = require('./functions.js')

module.exports = class Perception 
{
    constructor(fov, resolution, range)
    {
        this.fov = fov
        this.resolution = resolution
        this.linespacing = fov / resolution
        this.range = range
        this.sqrange = Math.pow(this.range, 2)
    }
    bodiesInRange(self, level)
    {
        let close = []
        for (let structure of level.getStructures(self.body.pos, this.range))
        {
            let sqdist = Func.sqDist(self.body.pos, structure.getCenter())
            if (sqdist < this.sqrange) close.push({dist: Math.sqrt(sqdist), body: structure})
        }
        let entities = [...level.entities, ...level.players]
        for (let entity of entities)
        {
            if (self === entity) continue
           let sqdist = Func.sqDist(self.body.pos, entity.body.pos)
            if (sqdist < this.sqrange) close.push({dist: Math.sqrt(sqdist), body: entity.body})
        }
        return close
    }
    createLines(self)
    {
        // start at angle - fov / 2
        const half = (this.fov * 0.5)
        const p1 = self.body.pos
        let lines = []
        for (let a = self.heading - half; a < self.heading + half; a += this.linespacing)
        {
            let x = p1.x + Math.cos(a) * this.range
            let y = p1.y + Math.sin(a) * this.range
            lines.push({a, line: {p1, p2: {x, y}}})
        }
        return lines
    }
    getSight(self, level)
    {
        let bodies = this.bodiesInRange(self, level)
        bodies.sort((a, b) => a.dist - b.dist) //sort ascending, closest first
        return {perception: this.castLines(self, bodies), bodies}
    }
    castLines(self, bodies)
    {
        let lines = this.createLines(self) // create lines
        let outputs = []
        for (let line of lines)
        {
            let ray = projectLine(line.line, bodies, this.range)
            outputs.push({a: line.a, ray})
        }
        return outputs
    }
}

function projectLine(line, colliders, max)
{
    //console.log('projecting:', line)
    let dist = max
    let obj = AIR
    for (let collider of colliders)
    {
        let body = collider.body
        let collision = handleLine(line, body)
        if (collision)
        {
            //console.log(collision)
             dist = Func.dist(line.p1, collision) // get distance to collision
             // check for entity
             if (body.entity !== null)
             {
                 obj = body.entity.type
                 break
             }
             obj = WALL
             break
        }
    }
    //no collision
    return {dist, obj}
}
function handleLine(line, collider)
{
    switch(collider.type)
    {
        case 'circle':
        let collision = lineOnCircle(line, collider)
        if (collision) return collider.pos
        return false
        //return lineOnCircle(line, collider)
        case 'rect':
        //console.log('colliding with rect')
        return lineOnRect(line, collider)
    }
    return null
}

function lineOnLine(line1, line2)
{
    let div = (line2.p2.y-line2.p1.y)*(line1.p2.x-line1.p1.x) - (line2.p2.x-line2.p1.x)*(line1.p2.y-line1.p1.y)
    let uA = ((line2.p2.x-line2.p1.x)*(line1.p1.y-line2.p1.y) - (line2.p2.y-line2.p1.y)*(line1.p1.x-line2.p1.x)) / div
    let uB = ((line1.p2.x-line1.p1.x)*(line1.p1.y-line2.p1.y) - (line1.p2.y-line1.p1.y)*(line1.p1.x-line2.p1.x)) / div

    let x = line1.p1.x + (uA * (line1.p2.x-line1.p1.x))
    let y = line1.p1.y + (uA * (line1.p2.y-line1.p1.y))

    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) return {x,y}
    return false
}

function posOnLine(pos, sqlen, line, margin)
{
    let err = margin || 0.05
    //console.log(err)
    const d1 = Func.dist(pos, line.p1)
    const d2 = Func.dist(pos, line.p2)
    const dsq = Math.pow(d1 + d2, 2)
    //console.log(d2)
    if (dsq >= sqlen - err && dsq <= sqlen + err) return pos
    return false
}

function getRectLines(pos, rect)
{
    const rh = rect.height * 0.5
    const rw = rect.width * 0.5
    const ydiff = pos.y - (rect.pos.y + rh)
    const xdiff = pos.x - (rect.pos.x + rw)
    // either left or right
    //console.log(xdiff, ydiff)
    if (Math.abs(ydiff) < rh)
    {
        if (Math.abs(xdiff) < rw) return false // or inside
        // RIGHT
        if (xdiff > 0) return [{p1: {x: rect.pos.x + rect.width, y: rect.pos.y}, p2: {x: rect.pos.x + rect.width, y: rect.pos.y + rect.height}}]
        // LEFT
        return [{p1: rect.pos, p2: {x: rect.pos.x, y: rect.pos.y + rect.height}}]
    }
    // it might be straight up or down
    if (Math.abs(xdiff) < rw)
    {
        // return bottom line
        if (ydiff > 0) return [{p1: {x: rect.pos.x, y: rect.pos.y + rect.height}, p2: {x: rect.pos.x + rect.width, y: rect.pos.y + rect.height}}]
        // return top line
        return [{p1: rect.pos, p2: {x: rect.pos.x + rect.width, y: rect.pos.y}}]
    }
    // not directly above or below, check angles
    let lines = []
    if (xdiff > 0) // right side
    { 
        lines.push({p1: {x: rect.pos.x + rect.width, y: rect.pos.y}, p2: {x: rect.pos.x + rect.width, y: rect.pos.y + rect.height}})
        // bottom
        if (ydiff > 0) lines.push({p1: {x: rect.pos.x, y: rect.pos.y + rect.height}, p2: {x: rect.pos.x + rect.width, y: rect.pos.y + rect.height}})
        // top
        else lines.push({p1: rect.pos, p2: {x: rect.pos.x + rect.width, y: rect.pos.y}})
        return lines
    }
    // left side
    lines.push({p1: rect.pos, p2: {x: rect.pos.x, y: rect.pos.y + rect.height}})
    // bottom
    if (ydiff > 0) lines.push({p1: {x: rect.pos.x, y: rect.pos.y + rect.height}, p2: {x: rect.pos.x + rect.width, y: rect.pos.y + rect.height}})
    // top
    else lines.push({p1: rect.pos, p2: {x: rect.pos.x + rect.width, y: rect.pos.y}})
    return lines
}
function lineOnRect(line, rect)
{
    // get the most likely collision lines
    let rectlines = getRectLines(line.p1, rect)
    if (rectlines === false) return false
    //console.log(rectlines.length)
    //console.log('reclines', rectlines)
    for (let rectline of rectlines)
    {
        //console.log(line, rectline)
        let collision = lineOnLine(line, rectline)
        //console.log('rect collision:', collision)
        if (collision) return collision // position of collision
    }
    return false
}
function posOnCircle(pos, circle)
{
    return (Math.pow(circle.rad, 2) >= Func.sqDist(pos, circle.pos))
}

function lineOnCircle(line, circle)
{
   // check if there's a chance for collision before doing expensive stuff
        // cheap check, ends of the line are inside circle
    if (posOnCircle(line.p1, circle) || posOnCircle(line.p2, circle)) return true
    // get dot product of line and circle
    const sqlen = Func.sqDist(line.p1, line.p2) // length of the line squared
    //dot product of line and circle
    let dot = (((circle.pos.x - line.p1.x) * (line.p2.x - line.p1.x)) + ((circle.pos.y - line.p1.y) * (line.p2.y - line.p1.y))) / sqlen

    // x, y coordinate of the collision
    let x = line.p1.x + (dot * (line.p2.x - line.p1.x))
    let y = line.p1.y + (dot * (line.p2.y - line.p1.y))
    let collision = {x, y}
    //console.log('collision:', collision)
    //console.log(circle.pos, circle.rad, circle.entity, collision, line)
    // is this point even on the line segment?
    if (!posOnLine(collision, sqlen, line, 0.4)) return false
    // it is, keep going
    return (Func.sqDist(collision, circle.pos) < Math.pow(circle.rad, 2))
}