const animals = ['🐷', '🐭', '🐹', '🐰', '🐼', '🐣', '🦆', '🦢', '🐸', '🦋', '🐞']
const monsters = ['🕷️', '🦇', '🐗', '🐞', '🦂', '🐙', '🦀', '🐲', '⛄', '🧟‍♀️', '🧟‍♂️']

function randomAnimal(seed)
{
    //console.log(seed)
    randomSeed(seed)
    let index = round(random(monsters.length - 1))
    return monsters[index]
}

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
        this.bounce = 0.2
        this.face = randomAnimal(bton(this.id) * 1000)
        this.cost = data.c || 1
    }
    update()
    {
        if (this.owner && !this.moving) this.target = this.owner.getHandPos(this.dist)
        this.pos = bounce(this.pos, this.target, this.bounce)
        let sqspeed = sqDist(this.pos, this.ppos)
        if (this.type === SWORD)
        {
            if (sqspeed > 0.01 && this.moving)
            {
                level.addWoosh(this.pos, this.ppos, 0.3)
                // ADDITIONAL: SOUND
                if (sqspeed > 0.04 && sound !== undefined)
                    sound.woosh(this.id, Math.sqrt(sqspeed) * 4, this.pos) // play a woosh
            }
            else if (sqspeed < 0.001 || !this.moving) sound.removeSound(this.id)
        }
        if (sqspeed > 0.00001) this.dir = atan2(this.ppos.y - this.pos.y, this.ppos.x - this.pos.x)
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
        if (data.I !== undefined)
            this.invulnerable = true
        else this.invulnerable = false
        if (data.c) this.cost = data.c
        if (data.P !== undefined) this.primed = data.P
    }
    draw()
    {
        // unknown item draw function
        push()
        fill(255, 255, 0)
        stroke(255, 125, 0)
        let pos = cam.onScreen(this.pos)
        textAlign(CENTER, CENTER)
        translate(pos.x, pos.y)
        rotate(this.dir + HALF_PI)
        textSize(this.dia * cam.zoom)
        text(this.face, 0, 0)
        //circle(pos.x, pos.y, this.dia * cam.zoom)
        pop()
    }
    kill()
    {
        // normally nothing
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
        this.size = 0.4
        this.dist = 0.5
        this.rot = 0
    }
    draw()
    {
        let rot = 0
        if (this.owner) rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        rot += this.rot
        let pos = cam.onScreen(this.pos)
        let size = this.size * cam.zoom
        drawItem(this.type, pos, size, rot)
    }
}

class Staff extends HandItem
{
    constructor(status)
    {
        super(status)
        this.size = 1
        this.offset = 0.3
        this.rot = - HALF_PI
        this.bounce = 0.5
        this.fire = new Fire(this.pos)
        this.fire.temp = 1
    }
    draw()
    {
        let rot = 0
        if (this.owner) rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        if (!this.moving) rot += HALF_PI
        rot += this.rot
        let pos = cam.onScreen(this.pos)
        let size = this.size * cam.zoom
        drawItem(this.type, pos, size, rot)
        if (this.moving)
        {
            let priming = sqDist(this.owner.pos, this.pos)
            //console.log(priming)
            if (priming > 0.1)
            {
                priming = sqrt(priming)
                let dst = this.size * 0.5
                let x = this.owner.pos.x + Math.cos(rot + this.rot) * (priming + dst)
                let y = this.owner.pos.y + Math.sin(rot + this.rot) * (priming + dst)
                let offset = 1 + this.primed
                this.fire.temp = offset
                this.fire.pressure = 0.001 * offset
                this.fire.pressurelimit = 0.01 * offset
                this.fire.draw({x, y})
                sound.playFire(this.id, this.pos)
            }
            else
            {
                this.fire.kill()
                sound.stopFire(this.id)
            }
        } else
        {
            this.fire.kill()
            sound.stopFire(this.id)
        }
    }
}

class Fist extends HandItem
{
    constructor(status)
    {
        super(status)
        this.rot = -HALF_PI
        this.bounce = 0.5
        this.size = 0.3
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
                    bowtarget = add(p5.Vector.fromAngle(rot).mult(this.drawreach), this.owner.pos)
                }
            }
        //console.log(this.bowpos)
        //let bp = bounce(this.bowpos, bowtarget, 1)
        this.bowpos = bounce(this.bowpos, bowtarget, 1)
        //console.log(bp, this.bowpos)
        let bowpos = cam.onScreen(this.bowpos)
        //console.log(bowpos)
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

            let p = subtract(cam.onScreen(this.pos), bowpos)
            let arrowpos = createVector(p.x, p.y).rotate(-rot)

            line(p1.x, p1.y, arrowpos.x, arrowpos.y)
            line(p4.x, p4.y, arrowpos.x, arrowpos.y)
        }
        pop()
        if (this.moving) drawArrow(this.pos, rot, 0, 1)

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
        this.bounce = 0.5
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

class FireBall extends Entity
{
    constructor(status)
    {
        super(status)
        this.fire = new Fire(this.pos)
        this.fire.temp = this.cost
        this.fire.pressure *= this.cost * 2
        this.fire.pressurelimit *= this.cost * 2
        this.fire.mindia += (this.cost * 0.02) 
        //if (this.cost > 1) console.log('big move!')
    }
    draw()
    {
        sound.playFire(this.id, this.pos)
        this.fire.draw(this.pos)
    }
    kill()
    {
        sound.stopFire(this.id)
    }
}