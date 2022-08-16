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
        this.owner = null
        this.dia = 40
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
        if (data.owner !== undefined) this.owner = level.getPlayer(data.owner)
    }
    draw()
    {
        // unknown item draw function
        push()
        fill(255, 255, 0)
        stroke(255, 125, 0)
        strokeWeight(2)
        rectMode(CENTER)
        rect(this.pos.x, this.pos.y, 20, 20)
        pop()
    }
    touch()
    {
        let pos = camera.onScreen(this.pos)
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
        let pos = camera.onScreen(this.pos)
        push()
        translate(pos.x, pos.y)
        fill(255, 0, 0)
        circle(0,0,5)
        rotate(rot + this.rot)
        textSize(this.spritesize)
        text(this.sprite, this.offset.x, this.offset.y)
        pop()
    }
}
class Fist extends HandItem
{
    constructor(status)
    {
        super(status)
        this.sprite = '✊'
        this.spriteSize = 50
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
        this.spritesize = 30
        this.dist = 0.8
        this.offset = createVector(-16, 10)
        this.rot = QUARTER_PI
    }
}