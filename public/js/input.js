class MobileInput {
    constructor()
    {
        this.joystick = new JoyStick()
        this.inventory = new Inventory(inventorySpecs)
        this.attackButtons = []
        this.usedTouches = []
        this.starttime = new Date().getTime()
        this.stats = new Stats()
        //print(height)
        this.attackButtons.push(new AttackButton('✊', 'physical', createVector(width - 150, height - 150), 65))
        //print('hello')

    }
    update()
    {
        this.updateTouches()
        let joyout = this.joystick.update()
        let actions = []
        let attacked = false
        for (let atk of this.attackButtons)
        {
            let attack = atk.update()
            if (attack && !attacked) 
            {
                actions.push(attack)
                attacked = true
            }
        }
        //do the inventory
        let inventoryactions = this.inventory.update()
        if (inventoryactions !== null) actions = [...actions, ...inventoryactions]
        //console.log(actions)

        let pointallocations = this.stats.update()
        if (pointallocations !== null) 
            actions = [...actions, ...pointallocations]

        //print(actions)
        //print(joyout)
        return {joy: {x: joyout.x, y: joyout.y}, actions}
    }
    time() //time since input was instantiated
    {
        return new Date().getTime() - this.starttime
    }
    draw()
    {
        this.joystick.draw()
        for (let atk of this.attackButtons)
        {
            atk.draw()
        }
        this.inventory.draw()
        this.stats.draw()
    }
    isFree(t)
    {
        return !inList(t.id, this.usedTouches)
    }
    getFreeTouch()
    {
        for (let t of touches)
        {
            if (this.isFree(t)) return t
        }
        return null
    }
    addTouch(t)
    {
        this.usedTouches.push(t.id)
    }
    updateTouches()
    {
        this.handleTouchEnd()
    }
    handleTouchEnd()
    {
        for (let i = this.usedTouches.length - 1; i >= 0; i--)
        {
            let ut = this.usedTouches[i]
            let found = false
            for (let t of touches)
            {
                if (ut === t.id) 
                {
                    found = true
                    break
                }
            }
            if (!found) this.usedTouches.splice(i, 1)
        }
    }
}

class Inventory
{
    constructor(specs)
    {
        this.items = []
        this.rowcount = specs.rowcount
        this.visible = specs.visible
        //this.currentTouch = {touch: null, index: 0}
        let div = 1 / 4
        if (width < 300) div = width / 1200
        this.x_start = width * div
        this.x_end = this.x_start * 3
        this.slots = this.initslots()
        this.fill(myitems)
        this.giveSelect(0)

        // OUTPUT
        this.actions = []
        this.stack = []
        this.activetouch = null
        this.swap = null
        //this.open = false
        //this.active = null
        // demo fill
    }
    fill(items)
    {
        console.log('filling inventory', items)
        for (let i in items)
        {
            this.slots[i].set(items[i])
        }
    }
    initslots()
    {
        let slots = []
        let slotsize = (this.x_end - this.x_start) / this.rowcount
        let y_start = height - this.visible * slotsize
        //top row
        let id = 0
        for (let j = 0; j < this.visible; j ++)
        {
            for (let i = 0; i < this.rowcount; i++)
            {
                //calc pos
                let y = y_start + j * slotsize
                let x = this.x_start + i * slotsize
                let pos = createVector(x, y)
                slots.push(new Slot(id, pos, slotsize))
                id ++
            }
        }
        return slots
    }
    draw()
    {
        this.slots.forEach(slot => slot.draw())
    }
    updateState() // click player to open
    {
      if (!player) return null
        let touch = player.touch()
        if (touch && input.isFree(touch))
        {
            input.addTouch(touch)
            this.open = !this.open
            return this.open ? 'inventory' : 'close'
        }
        return null
    }
    setActive(slot, touch)
    {
        this.active = slot
        this.activetouch = touch
    }
    getCurrentTouch()
    {
    if (this.activetouch === null) return null
    return getTouchById(this.activetouch.id)
    }
    addToSpread(slot)
    {
        //this.spread = []
        console.log('stack:', this.stack)
        for (let s of this.stack)
        {
            if (s.id === slot.id) return
        }
        this.stack.push(slot)
    }
    setSwap(slot)
    {
        //console.log()
        this.swap = slot
        //console.log(this.swap)
    }
    giveSelect(id)
    {
        this.slots.forEach(slot => slot.selected = false) // deselect all
        this.slots[id].selected = true
    }
    getActions()
    {
        let output = []
        this.actions.forEach(action => output.push(action))
        this.actions = []
        return output
    }
    updateInventory(inventory)
    {
        if (inventory.slots !== null) this.fill(inventory.items)
        if (inventory.selection !== null) this.giveSelect(inventory.selection)
    }
    update()
    {
        let newstate = this.updateState()
        if (newstate) //something is happening!
        {
            // do something fancy
        }
        //let newselect = this.selected
        for (let slot of this.slots)
        {
            let action = slot.update(this)
            if (action) this.actions.push(action)
        }
        let ongoingtouch = this.getCurrentTouch()
        if (!ongoingtouch && this.actions.length) return this.getActions() // action finished
        return null
    }
}

class Slot
{
    constructor(id, pos, size, item)
    {
        this.pos = pos
        this.size = size
        this.id = id
        this.item = item || {count: 0, type: 'none'}
        this.touch = null
        this.selected = false
        this.doubleclicked = false
        this.touchtime = null
    }
    getData()
    {
        return {id: this.id, item: this.item}
    }
    empty()
    {
        this.item.count = 0
        this.item.type = 'none'
    }
    update(inventory)
    {
        let newtouch = this.newTouch(inventory)
        //console.log(inventory.activetouch)
        let ongoingtouch = inventory.getCurrentTouch()

        // if ongoing touch do something special
        
        if (newtouch !== null) 
        {
            this.touch = newtouch
            input.addTouch(newtouch)
            return {type: 'inventory', selection: this.id}
        }
        return null
    }
    draw()
    {
        push()
        noFill()
        let col = this.selected ? color(255, 0, 0) : color(0, 0, 0)
        stroke(col)
        strokeWeight(2)
        //if (this.doubleclicked) fill(0, 0, 255, 100)
        rect(this.pos.x, this.pos.y, this.size, this.size)
        if (this.item.type !== 'none') {
            textAlign(CENTER, CENTER)
            textSize(20)
            fill(0)
            let pos = p5.Vector.add(this.pos, createVector(this.size / 2, this.size / 2))
            text(this.item.type, pos.x, pos.y)
            pos.add(createVector(this.size / 3, this.size / 3))
            noStroke() //strokeWeight(1)
            fill(255)
            stroke(255)
            text(this.item.count, pos.x, pos.y)
        }
        pop()
    }
    set (item)
    {
        this.item.type = item.type
        this.item.count = item.count
    }
    pressed()
    {
        if (!this.touch) return false
        let touch = getTouch(this.touch)
        if (!touch) return false
        return this.touched(touch)
    }
    touched(touch)
    {
        return onField(
            {x: touch.x, y: touch.y}, 
            {x1: this.pos.x, y1: this.pos.y, x2: this.pos.x + this.size, y2: this.pos.y + this.size})
    }  
    newTouch()
    {
        for (let touch of touches)
        {
            if (input.isFree(touch) && this.touched(touch)) return touch
        }
        return null
    }
}

class AttackButton
{
    constructor(item, type, pos, dia)
    {
        this.type = type
        this.item = item //linked item (for visuals)
        this.pos = pos
        let xdist = width - pos.x
        let ydist = height - pos.y
        this.limit = (xdist > ydist) ? xdist : ydist
        this.dia = dia || 70
        this.attack = false
        this.drag = null
    }
    onButton(t, factor)
    {
        let margin = factor || 0.5
        return (this.pos.dist(createVector(t.x, t.y)) < this.dia * margin)
    }
    draw()
    {
        if (this.attack && this.drag) 
        {
            push()
            translate(this.pos.x, this.pos.y)
            stroke(255, 0, 0, 100)
            strokeWeight(3)
            line(0, 0, this.drag.x, this.drag.y)
            pop()
        }
        push()
        stroke(255, 0, 0, 200)
        fill(255, 0, 0, 150)
        strokeWeight(3)
        stroke(255, 0, 0)
        translate(this.pos.x, this.pos.y)
        circle(0, 0, this.dia)
        textAlign(CENTER, CENTER)
        textSize(this.dia * 0.5)
        text(this.item, 0, 0)
        pop()
    }
    getOutput(action)
    {
        // no drag cases
        if (action == 'touch' || (action == 'end' && this.drag == 'touch'))
            return {type: this.type, action, rot: 0, mag: 0}

        let out = p5.Vector.mult(this.drag, 128 / this.limit)
        return { 
        type: this.type, 
        action,
        dir: {x: out.x, y: out.y}
        }
    }

    update()
    {
        let attackFinished = true
        for (let t of touches)
        {
            // first touch
            if (!this.attack && this.onButton(t) && !inList(t.id, input.usedTouches)) 
            {
                this.attack = true //we're gonna attack
                this.touch = t.id
                this.drag = 'touch'
                attackFinished = false //but we're not done yet
                input.addTouch(t)
                break //done
            }
            //existing touch, check for drag
            if (this.attack && t.id === this.touch) 
            {
                attackFinished = false //still not done
                if (this.onButton(t, 0.3)) this.drag = 'touch'
                else 
                {
                    this.drag = p5.Vector.sub(createVector(t.x, t.y), this.pos)
                    this.drag.limit(this.limit)
                }
                break //done
            }
        }
        if (this.attack) 
        {
            if (attackFinished)
            {
                this.attack = false
                return this.getOutput('end')
            }
            if (this.drag !== 'touch') return this.getOutput('move')
            else return this.getOutput(this.drag)
        }
        return null
    }
}

class Settings
{ // draw on the top left corner
// includes sound settings,mu
    constructor()
    {

    }
}
class Stats
{ // draw on the top right corner
    constructor()
    {
        this.area = {x1:width - 120, y1: 15, x2: width - 20, y2: 40}
        this.width = this.area.x2 - this.area.x1
        this.height = this.area.y2 - this.area.y1
        this.maxXP = 100
        this.xp = 0
        this.level = 1

        this.open = false
        this.points = 0
        this.strength = 1
        this.vitality = 1
        this.speed = 1
    }
    updateData(status)
    {
        this.xp = status.xp
        this.maxXP = status.xpnext
        if (status.level > this.level) player.levelUP()
        this.level = status.level
        this.points = status.points

        this.strength = status.strength
        this.vitality = status.vitality
        this.speed = status.speed

        this.strengthButton = new SimpleButton({x: this.area.x2 - 10, y: this.area.y2 + 20}, '1P')
        this.vitalityButton = new SimpleButton({x: this.area.x2 - 10, y: this.area.y2 + 50}, '1P')
        this.speedButton = new SimpleButton({x: this.area.x2 - 10, y: this.area.y2 + 80}, '1P')
    }
    draw()
    {
        let w = map(this.xp, 0, this.maxXP, 0, this.width)
        if (!this.open && this.points > 0) 
        {
            push()
            textAlign(RIGHT)
            stroke(0)
            fill(255)
            text('points available!', this.area.x1 - 20, (this.area.y2 + this.area.y1) * 0.5)
            noFill()
            stroke(0, 100, 255)
            strokeWeight(3)
            rect(this.area.x1 - 5, this.area.y1 - 5, this.width + 10, this.height + 10, 8)
            pop()
        }
        // XP BAR
        push()
        stroke(0)
        strokeWeight(1)
        noFill()
        rect(this.area.x1, this.area.y1, this.width, 12, 5)
        noStroke()
        fill(0, 255, 255, 100)
        rect(this.area.x1, this.area.y1, w, 12, 5)

        // TEXT
        fill(255)
        stroke(0)
        strokeWeight(1)
        textAlign(LEFT)
        text('LVL ' + this.level, this.area.x1, this.area.y2)
        textAlign(RIGHT)
        text(this.xp + '/' + this.maxXP, this.area.x2, this.area.y2)

        if (this.open) this.drawAttributes()
        pop()
    }
    drawAttributes()
    {
        textSize(16)
        textAlign(RIGHT, CENTER)
        if (this.points)
        {
            this.strengthButton.draw()
            this.vitalityButton.draw()
            this.speedButton.draw()
        }
        const offset = 30
        text('strength: ' + this.strength, this.strengthButton.pos.x - offset, this.strengthButton.pos.y)
        text('vitality: ' + this.vitality, this.vitalityButton.pos.x - offset, this.vitalityButton.pos.y)
        text('agility: ' + this.speed, this.speedButton.pos.x - offset, this.speedButton.pos.y)
    }
    toggleAttributes()
    {
        let allocations = []
        if (this.strengthButton.update()) allocations.push({type: 'allocation', attribute: 'strength'})
        if (this.speedButton.update()) allocations.push({type: 'allocation', attribute: 'speed'})
        if (this.vitalityButton.update()) allocations.push({type: 'allocation', attribute: 'vitality'})
        if (!allocations.length) return null
        return allocations
    }
    update()
    {
        for (let t of touches)
        {
            if (onField(t, this.area) && !inList(t.id, input.usedTouches))
            {
                input.addTouch(t)
                // switch to open
                this.open = !this.open
                return null
            }
        }
        if (this.open) return this.toggleAttributes()
        return null
    }
}

class SimpleButton
{
    constructor(pos, char)
    {
        this.pos = pos
        this.area = {x1: this.pos.x - 20, y1: this.pos.y - 12, x2: this.pos.x + 20, y2: this.pos.y + 12}
        this.char = char
    }
    draw()
    {
        push()
        rectMode(CORNERS)
        fill(0, 255, 0)
        noStroke()
        rect(this.area.x1, this.area.y1, this.area.x2, this.area.y2, 5)
        stroke(255)
        strokeWeight(2)
        textSize(18)
        fill(255)
        textAlign(CENTER, CENTER)
        text(this.char, this.pos.x, this.pos.y)
        pop()
    }
    update()
    {
        for (let t of touches)
        {
            if (onField(t, this.area) && !inList(t.id, input.usedTouches))
            {
                input.addTouch(t)
                // switch to open
                return true
            }
        }
        return false
    }
}

class JoyStick 
{
    constructor(dia)
    {
        this.max = 128
        this.active = false
        this.dia = dia || 150
        this.area = {x1:0, y1: height / 2, x2: width / 4, y2: height}
        this.center = createVector(0, 0)
        this.joy = createVector(0, 0)
        this.touch = null
        this.hintcompleted = false
    }
    draw() 
    {
        if (!this.hintcompleted) this.drawHint()
        if (!this.active) return

        push()
        noStroke()
        fill(100, 100, 100, 100)
        circle(this.center.x, this.center.y, this.dia)
        fill(200, 200, 200, 150)
        circle(this.joy.x, this.joy.y, this.dia / 3)
        pop()
    }
    drawHint()
    {
        push()
        stroke(100, 100, 100, 100)
        noFill()
        strokeWeight(5)
        rectMode(CORNERS)
        rect(this.area.x1, this.area.y1, this.area.x2, this.area.y2, 5)
        fill(100, 100, 100, 100)
        textSize(20)
        textAlign(CENTER, CENTER)
        strokeWeight(2)
        text("joystick", (this.area.x1 + this.area.x2) * 0.5, (this.area.y1 + this.area.y2) * 0.5)
        pop()
        if (this.active) this.hintcompleted = true
    }
    update()
    {
        for (let t of touches)
        {
            // new touch
            if (!this.active && onField(t, this.area) && !inList(t.id, input.usedTouches)) 
            {
                this.place(t)
                input.addTouch(t)
                return createVector(0, 0)
            }
            //existing touch
            if (this.active && t.id === this.touch) return this.updateJoy(t)
        }
        return this.cancelJoy() //no updates
    }
    cancelJoy()
    {
        this.touch = null
        this.active = false
        return createVector(0, 0)
    }
    updateJoy(t)
    {
        this.joy = createVector(t.x, t.y) //register pos
        let diff = p5.Vector.sub(this.joy, this.center).limit(this.dia / 2) // get output and limit
        this.joy = p5.Vector.add(this.center, diff) //apply limit
        return diff.mult(2 * this.max / this.dia) //scale
    }
    place(t)
    {
        //print(t)
        this.center = createVector(t.x, t.y)
        this.active = true
        this.touch = t.id
    }
}