class Entity
{
    constructor(data)
    {
        this.id = data.i
        this.target = data.p
        this.pos = data.p
        this.ppos = data.p
        this.type = data.t
        this.moving = data.m || false //specific for 
        this.dir = 0
        this.owner = false
        this.dia = 0.4
        this.speed = 0
        this.bounce = 0.2
    }
    update()
    {
        if (this.owner && !this.moving) this.target = this.owner.getHandPos(this.dist)
        this.pos = bounce(this.pos, this.target, this.bounce)
        this.speed = dist(this.pos.x, this.pos.y, this.ppos.x, this.ppos.y)
        if (this.type === SWORD && this.speed > 0.1 && this.moving)
            level.addWoosh(this.pos, this.ppos, 0.3)
        if (this.speed > 0.01) this.dir = atan2(this.ppos.y - this.pos.y, this.ppos.x - this.pos.x)
        this.ppos = {x: this.pos.x, y: this.pos.y}
    }
    newData(data)
    {
        this.target = data.p
        //console.log(data.pos)
        if (data.m !== undefined) this.moving = data.m
        if (data.o !== undefined) 
            {
                if (!this.owner) // start sprite at owner (as if grabbing from inventory)
                    this.pos = level.getPlayer(data.o).pos
                this.owner = level.getPlayer(data.o)
            }
    }
    draw()
    {
        // unknown item draw function
        push()
        fill(255, 255, 0)
        stroke(255, 125, 0)
        let pos = cam.onScreen(this.pos)
        circle(pos.x, pos.y, this.dia * cam.zoom)
        pop()
    }
    touch()
    {
        let pos = cam.onScreen(this.pos)
        for (let t of touches)
        {
            if (dist(t.x, t.y, pos.x, pos.y) < this.dia) return t
        }
        return null
    }
}

class Arrow extends Entity {
constructor(entity){
    super(entity)
    this.bounce = 0.2
    this.size = 1
}
    draw()
    {
        drawArrow(this.pos, this.dir + PI, 0.15, this.size)
    }
}

class HandItem extends Entity
{
    constructor(status)
    {
        super(status)
    }
    draw()
    {
        let rot = 0
        if (this.owner) rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        //if (this.moving && this.owner) rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        let pos = cam.onScreen(this.pos)
        push()
        translate(pos.x, pos.y)
        fill(255, 0, 0)
        circle(0,0,5)
        rotate(rot + this.rot)
        textSize(this.spritesize * cam.zoom)
        text(this.sprite, this.offset.x, this.offset.y)
        pop()
    }
}

function drawArrow(levelpos, dir, offset, size)
{
    let pos = cam.onScreen(levelpos)
    let off = offset * cam.zoom
    let tip = cam.zoom * size + off
    let tipsize = 0.04 * cam.zoom
    push()
    translate(pos.x, pos.y)
    rotate(dir)
    stroke(0)
    strokeWeight(2)
    line(off, 0, tip, 0)
    stroke(255, 0, 0)
    triangle(tip + tipsize, 0, tip, -tipsize, tip, tipsize)
    //circle(60, 0, 10)
    pop()
}
class Bow extends HandItem
{
    constructor(status)
    {
        super(status)
        this.dist = 0.6
        this.bowpos = this.pos
        this.drawreach = 0.5
        this.size = 0.1
    }
    draw()
    {
        let rot = 0, draw = 0, bowtarget = this.pos, basedraw = 0.1
        if (this.owner) 
            {
                rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
                if (this.moving) 
                {
                    draw = dist(this.owner.pos.x, this.owner.pos.y, this.pos.x, this.pos.y)
                    bowtarget = p5.Vector.fromAngle(rot).mult(this.drawreach).add(this.owner.pos)
                }
            }
        this.bowpos = bounce(this.bowpos, bowtarget, 1)
        let bowpos = cam.onScreen(this.bowpos)
        //if (this.moving && this.owner) rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        // draw the bow
        push()
        translate(bowpos.x, bowpos.y)
        rotate(rot)
        strokeWeight(0.1 * cam.zoom)
        stroke(200, 150, 40)
        //line(0, -30, 0, 30)
        // front of the bow points
        let bend = 2 * this.size * cam.zoom
        let p2 = createVector(this.size * cam.zoom, -bend)
        let p3 = createVector(this.size * cam.zoom, bend)
        //draw += basedraw
        if (draw === 0) draw = -basedraw
        draw *= 3
        let p1 = p5.Vector.fromAngle(-draw - HALF_PI).mult(bend + abs(draw * bend * 0.25)).add(p2)
        let p4 = p5.Vector.fromAngle(draw + HALF_PI).mult(bend + abs(draw * bend * 0.25)).add(p3)
        noFill()
        bezier(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)
        if (!this.moving)
        {
            strokeWeight(0.05 * cam.zoom)
            stroke(0, 100)
            line(p1.x, p1.y, p4.x, p4.y)
        } else
        {
            strokeWeight(0.05 * cam.zoom)
            stroke(0, 100)
            let arrowpos = cam.onScreen(this.pos).sub(bowpos).rotate(-rot)
            line(p1.x, p1.y, arrowpos.x, arrowpos.y)
            line(p4.x, p4.y, arrowpos.x, arrowpos.y)
        }
        pop()
        if (this.moving) drawArrow(this.pos, rot, 0, 1)

    }
}
class Wood extends HandItem
{
    constructor(status)
    {
        super(status)
        this.size = 0.4
        this.dist = 0.5
       // console.log(this)
    }
    draw()
    {
        let rot = 0
        if (this.owner) rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        let pos = cam.onScreen(this.pos)
        let size = this.size * cam.zoom
        drawWood(pos, size, rot)
    }
}
class Fist extends HandItem
{
    constructor(status)
    {
        super(status)
        this.sprite = '✊'
        this.spriteSize = 0.30
        this.dist = 0.4
        this.offset = createVector(0, 5)
        this.rot = PI + HALF_PI
    }
}

class Sword extends HandItem
{
    constructor(status)
    {
        super(status)
        this.size = 0.6
        this.dist = 0.8
        this.offset = 0.3
    }
    draw()
    {
        let pos = cam.onScreen(this.pos)
        let rot = 0
        if (this.owner) rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        push()
        translate(pos.x, pos.y)
        rotate(rot)
        translate(this.offset * cam.zoom, 0)
        let hilt = this.size * 0.3 * cam.zoom
        let len = -this.size * cam.zoom
        //rotate(this.dir)
        //triangle
        fill(255)
        stroke(0, 150)
        strokeWeight(0.02 * cam.zoom)
        triangle(hilt + len, 0, 0, hilt * 0.2, 0, -hilt * 0.2)
        //length line
        line(hilt, 0, hilt + len, 0)
        //hilt guard
        stroke(150)
        strokeWeight(0.05 * cam.zoom)
        line(0, hilt * 0.5, 0, -hilt * 0.5)
        //grip
        stroke(200, 100, 50)
        line(0,0,hilt, 0)
        pop()
    }
}