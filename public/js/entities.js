const animals = ['🐷', '🐭', '🐹', '🐰', '🐼', '🐣', '🦆', '🦢', '🐸', '🦋', '🐞']
const monsters = ['🦇', '🐗', '🦂', '🐙', '🧟‍♀️', '🧟‍♂️', '🐸']
const icecream = ['🍩' ,'🍦', '🧁', '🍧', '🍨']

let critterlist = () =>
{
    switch(skin)
    {
        case 'ice':
            return icecream
        default:
            return monsters
    }
}

function randomAnimal(seed, list)
{
    //console.log(seed)
    randomSeed(seed)
    let index = round(random(list.length - 1))
    return list[index]
}

class Entity
{
    constructor(data)
    {
        this.id = data.i
        this.type = data.t
        this.dir = 0
        this.dia = 0.4
        this.bounce = 0.2
        this.pos = data.p
        this.ppos = data.p
        this.newData(data)
    }
    update()
    {
        if (this.owner && !this.moving) this.target = this.owner.getHandPos(this.dist)
        this.pos = bounce(this.pos, this.target, this.bounce)
        let sqspeed = sqDist(this.pos, this.ppos)
        if (this.type === SWORD || this.type === NONE)
        {
            switch(this.type)
            {
                case SWORD:
                    if (sqspeed > 0.01 && this.moving)
                    {
                        level.addWoosh(this.pos, this.ppos, 0.3)
                        // ADDITIONAL: SOUND
                        if (sqspeed > 0.04)
                            sound.woosh(this.id, Math.sqrt(sqspeed) * 4, this.pos) // play a woosh
                    }
                    else if (sqspeed < 0.001 || !this.moving) sound.removeSound(this.id)
                break
                case NONE:
                    if (sqspeed > 0.01 && this.moving)
                    {
                        if (sqspeed > 0.04)
                            sound.fistwoosh(this.id, Math.sqrt(sqspeed) * 4, this.pos) // play a woosh
                    }
                    else if (sqspeed < 0.001 || !this.moving) sound.removeSound(this.id)
                break
            }
        }
        if (sqspeed > 0.00001) this.dir = Math.atan2(this.ppos.y - this.pos.y, this.ppos.x - this.pos.x)
        this.ppos = {x: this.pos.x, y: this.pos.y}
    }
    newData(data)
    {
        this.target = data.p
        //console.log(data.pos)
        if (data.m !== undefined) this.moving = data.m
        if (data.o !== undefined) 
            {
                let p_own = this.owner
                this.owner = level.getPlayer(data.o)
                if (!p_own) // start sprite at owner (as if grabbing from inventory)
                    this.pos = this.owner.pos
            }
        if (data.I !== undefined)
            this.invulnerable = true
        else this.invulnerable = false
        if (data.c) this.cost = data.c
        if (data.P !== undefined) this.primed = data.P
        if (data.links != undefined)  this.links = data.links
        if (data.g) this.grounditem = true
        //console.log(data.g)
    }
    drawOutline()
    {
        push()
        noStroke()
        let pos = cam.onScreen(this.pos)
        fill(255, 255, 0, 100)
        circle(pos.x, pos.y, 0.5 * cam.zoom)
        pop()
    }
    draw()
    {
        // unknown item draw function
        push()
        fill(255, 255, 0)
        noStroke()
        let pos = cam.onScreen(this.pos)
        circle(pos.x, pos.y, this.dia * cam.zoom)
        pop()
    }
    touch()
    {
        let pos = cam.onScreen(this.pos)
        for (let t of touches)
        {
            if (sqDist(t, pos) < Math.pow(this.dia, 2)) return t
        }
        return null
    }
}

class Critter extends Entity
{
    constructor(entity)
    {
        super(entity)
        this.face = randomAnimal(bton(this.id) * 1000, critterlist())
        //this.face = chooseOne(critterlist(), bton(this.id) * 1000)

    }
    draw()
    {
        push()
        fill(255, 255, 0)
        stroke(255, 125, 0)
        let pos = cam.onScreen(this.pos)
        textAlign(CENTER, CENTER)
        translate(pos.x, pos.y)
        rotate(this.dir + HALF_PI)
        textSize(this.dia * cam.zoom)
        text(this.face, 0, 0)
        pop()
        
    }
}

class Charger extends Entity
{
    constructor(entity)
    {
        super(entity)
        //this.face = randomAnimal(bton(this.id) * 1000, critterlist())
        this.dia = 0.8
    }
    draw()
    {
        push()
        fill(255, 255, 0)
        stroke(255, 125, 0)
        let pos = cam.onScreen(this.pos)
        textAlign(CENTER, CENTER)
        translate(pos.x, pos.y)
        rotate(this.dir + HALF_PI)
        textSize(this.dia * cam.zoom)
        text('🧸', 0, 0)
        pop()
    }
}


class Arrow extends Entity {
constructor(entity){
    super(entity)
    this.bounce = 0.2
    this.size = 1
    if (this.cost > 1) 
    {
        this.onFire = true
        this.fire = new Fire(this.pos)
        this.fire.mindia = this.cost * 0.07 
    }
}
    draw()
    {
        if (this.onFire) this.fire.draw(this.pos)
        drawArrow(this.pos, this.dir + PI, 0.15, this.size)
    }
    kill()
    {
        if (this.fire) // pass the effect to the effect handler
            level.events.push(new ContinuedFire(this.fire))
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
        if (player && this.owner)
        {
            if (this.owner.id === player.id) weapon = this
        }
        
    }
    draw()
    {
        if (this.grounditem) this.drawOutline()
        let rot = 0
        if (this.owner) rot = Math.atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
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
        if (this.grounditem) this.drawOutline()
        let rot = 0
        if (this.owner) rot = Math.atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        if (!this.moving) rot += HALF_PI
        rot += this.rot
        let pos = cam.onScreen(this.pos)
        let size = this.size * cam.zoom
        drawItem(this.type, pos, size, rot)
        if (this.moving && this.owner)
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

class Flail extends Entity
{
    constructor(status)
    {
        super(status)
        this.links = status.links
        this.bounce = 0.3
        this.owner = false
        this.dist = 0.5
        this.soundtrigger = 0.0005
    }
    update()
    {
    if (this.owner && !this.moving) 
        this.target = this.owner.getHandPos(this.dist)
    this.pos = bounce(this.pos, this.target, this.bounce)
    //console.log(this.pos, this.target, this.ppos)
    let sqspeed = sqDist(this.pos, this.ppos)
    //console.log(sqspeed)
    if (sqspeed > this.soundtrigger && this.moving)
    {
        level.addWoosh(this.pos, this.ppos, 0.3)
        // ADDITIONAL: SOUND
        sound.lowwoosh(this.id, Math.sqrt(sqspeed) * 4, this.pos) // play a woosh
    }
    else if (sqspeed < this.soundtrigger || !this.moving) sound.removeSound(this.id)
    this.ppos = this.pos
    }
    draw()
    {
    if (this.grounditem) this.drawOutline()
       if (this.moving)
       {
        push()
        fill(80, 120)
        noStroke()
        for (let i = 1; i < this.links.length - 1; i++)
        {
            let pos = cam.onScreen(this.links[i])
            circle(pos.x, pos.y, cam.zoom * 0.1)
        }
        let pos = cam.onScreen(this.links[0])
        let rot = 0
        if (this.owner) rot = Math.atan2(this.owner.pos.y - this.links[0].y, this.owner.pos.x - this.links[0].x)
        stroke(200, 150, 40)
        strokeWeight(cam.zoom * 0.1)
        noFill()
        translate(pos.x, pos.y)
        rotate(rot)
        line(0, 0, cam.zoom * 0.25, 0)
        pop()
    }
    push()
    let pos = cam.onScreen(this.pos)
    fill(80)
    noStroke()
    circle(pos.x, pos.y, cam.zoom * 0.3)
    pop()
    }
    kill()
    {

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
    strokeWeight(0.02 * cam.zoom)
    line(off, 0, tip, 0)
    //stroke(255, 0, 0)
    noStroke()
    fill(255, 0, 0)
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
    drawTrail()
    {
        //console.log('drawing trail', this.bowdraw)
        if (!this.bowdraw) return
        if (this.bowdraw < 0.2) return

        let diff = subtract(player.pos, this.pos)
        let p_diff = createVector(diff.x, diff.y)
        let p_pos = createVector(player.pos.x, player.pos.y)
        push()
        for (let i = 0; i < 3; i ++)
        {
            let p = p5.Vector.mult(p_diff, (i * 1.2) + 2)
            p.add(p_pos)
            let pos = cam.onScreen(p)
            fill(51, 100 - (i * 20))
            noStroke()
            circle(pos.x, pos.y, 10 - (i * 2))
        }
        pop()
    }
    draw()
    {
        let rot = 0, draw = 0, bowtarget = this.pos, basedraw = 0.05
        if (this.owner) 
            {
                rot = Math.atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
                if (this.moving) 
                {
                    draw = dist(this.owner.pos.x, this.owner.pos.y, this.pos.x, this.pos.y)
                    this.bowdraw = draw
                    draw += 0.1
                    bowtarget = add(p5.Vector.fromAngle(rot).mult(this.drawreach), this.owner.pos)
                }
            }
        //console.log(this.bowpos)
        //let bp = bounce(this.bowpos, bowtarget, 1)
        this.bowpos = bounce(this.bowpos, bowtarget, 1)
        //console.log(bp, this.bowpos)
        let bowpos = cam.onScreen(this.bowpos)
        if (this.grounditem) this.drawOutline()
        //console.log(bowpos)
        //if (this.moving && this.owner) rot = atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        // draw the bow
        push()
        translate(bowpos.x, bowpos.y)
        rotate(rot)
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
        if (this.primed && this.moving)
        {
            strokeWeight(0.2 * cam.zoom)
            stroke(255, 60, 60, 80)
            bezier(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)
        }
        strokeWeight(0.1 * cam.zoom)
        stroke(200, 150, 40)
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
        if (this.owner) rot = Math.atan2(this.owner.pos.y - this.pos.y, this.owner.pos.x - this.pos.x)
        let extraoffset = 0
        if (this.grounditem) 
        {
            this.drawOutline()
            extraoffset = -0.2
        }
        push()
        translate(pos.x, pos.y)
        rotate(rot)
        translate((this.offset + extraoffset) * cam.zoom, 0)
        let hilt = this.size * 0.3 * cam.zoom
        let len = -this.size * cam.zoom
        //rotate(this.dir)
        //triangle
        fill(255)
        stroke(0, 150)
        strokeWeight(0.01 * cam.zoom)
        triangle(hilt + len, 0, 0, hilt * 0.2, 0, -hilt * 0.2)
        //length line
        line(hilt, 0, hilt + len, 0)
        //grip
        strokeWeight(0.05 * cam.zoom)
        stroke(200, 100, 50)
        line(0,0,hilt, 0)
        //hilt guard
        stroke(150)
        line(0, hilt * 0.5, 0, -hilt * 0.5)
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
        if (this.fire) // pass the effect to the effect handler
            level.events.push(new ContinuedFire(this.fire))
    }
}