class Entity
{
    constructor(data)
    {
        this.id = data.id
        this.target = data.pos
        this.pos = data.pos
        this.ppos = data.pos
        this.type = data.type
        this.moving = data.moving || false //specific for 
        this.dir = 0
        this.owner = false
        this.dia = 0.4
        this.distance = 0
    }
    update()
    {
        if (this.owner && !this.moving) this.target = this.owner.getHandPos(this.dist)
        this.pos = bounce(this.pos, this.target, 0.2)
        let speed = dist(this.pos.x, this.pos.y, this.ppos.x, this.ppos.y)
        this.distance += speed
        if (speed > 0.01) this.dir = atan2(this.ppos.y - this.pos.y, this.ppos.x - this.pos.x)
        this.ppos = {x: this.pos.x, y: this.pos.y}
    }
    newData(data)
    {
        this.target = data.pos
        //console.log(data.pos)
        if (data.moving !== undefined) this.moving = data.moving
        if (data.owner !== undefined) 
            {
                if (!this.owner) // start sprite at owner (as if grabbing from inventory)
                    this.pos = level.getPlayer(data.owner).pos
                this.owner = level.getPlayer(data.owner)
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

function drawArrow(levelpos, dir)
{
    let pos = cam.onScreen(levelpos)
    push()
    translate(pos.x, pos.y)
    rotate(dir)
    stroke(0)
    strokeWeight(2)
    line(0, 0, 60, 0)
    triangle(65, 0, 60, -5, 60, 5)
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
        strokeWeight(5)
        stroke(200, 150, 40)
        //line(0, -30, 0, 30)
        // front of the bow points
        let p2 = createVector(10, -20)
        let p3 = createVector(10, 20)
        //draw += basedraw
        if (draw === 0) draw = -basedraw
        draw *= 3
        let p1 = p5.Vector.fromAngle(-draw - HALF_PI).mult(20 + abs(draw * 5)).add(p2)
        let p4 = p5.Vector.fromAngle(draw + HALF_PI).mult(20 + abs(draw * 5)).add(p3)
        noFill()
        bezier(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)
        if (!this.moving)
        {
            strokeWeight(2)
            stroke(0, 100)
            line(p1.x, p1.y, p4.x, p4.y)
        } else
        {
            strokeWeight(2)
            stroke(0, 100)
            let arrowpos = cam.onScreen(this.pos).sub(bowpos).rotate(-rot)
            line(p1.x, p1.y, arrowpos.x, arrowpos.y)
            line(p4.x, p4.y, arrowpos.x, arrowpos.y)
        }
        pop()
        if (this.moving) drawArrow(this.pos, rot)

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
        this.sprite = '🗡️'
        this.spritesize = 0.4
        this.dist = 0.8
        this.offset = createVector(-16, 10)
        this.rot = QUARTER_PI
    }
}